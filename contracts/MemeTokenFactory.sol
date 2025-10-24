// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MemeTokenFactory
 * @notice Deploys MemeToken instances that can be traded and managed by their creators.
 */
contract MemeTokenFactory {
    address[] public deployedTokens;

    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        string description,
        string image,
        string twitter,
        string telegram,
        string website,
        address indexed developer
    );

    function createToken(
        string memory name,
        string memory symbol,
        string memory description,
        string memory image,
        string memory twitter,
        string memory telegram,
        string memory website
    ) external returns (address tokenAddress) {
        MemeToken newToken = new MemeToken(
            name,
            symbol,
            description,
            image,
            twitter,
            telegram,
            website,
            msg.sender
        );
        tokenAddress = address(newToken);
        deployedTokens.push(tokenAddress);

        emit TokenCreated(
            tokenAddress,
            name,
            symbol,
            description,
            image,
            twitter,
            telegram,
            website,
            msg.sender
        );
    }

    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }
}

/**
 * @title MemeToken
 * @notice ERC20 token with a bonding-curve style pricing model and basic liquidity helpers.
 */
contract MemeToken is ERC20, Ownable {
    string public description;
    string public image;
    string public twitter;
    string public telegram;
    string public website;
    address public developer;
    uint256 public constant MAX_SUPPLY = 1_000_000e18;

    event TokensPurchased(
        address indexed purchaser,
        uint256 amount,
        uint256 pricePerToken
    );
    event TokensSold(
        address indexed seller,
        uint256 amount,
        uint256 pricePerToken
    );
    event LiquidityAdded(uint256 tokenAmount, uint256 ethAmount);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _description,
        string memory _image,
        string memory _twitter,
        string memory _telegram,
        string memory _website,
        address _developer
    )
        ERC20(_name, _symbol)
        Ownable(_developer) // ✅ FIX: Pass the initial owner here
    {
        require(bytes(_name).length > 0, "name required");
        require(bytes(_symbol).length > 0, "symbol required");
        require(_developer != address(0), "developer required");

        description = _description;
        image = _image;
        twitter = _twitter;
        telegram = _telegram;
        website = _website;
        developer = _developer;

        _mint(address(this), MAX_SUPPLY);
    }

    receive() external payable {
        buyTokens();
    }

    function buyTokens() public payable {
        require(msg.value > 0, "send ETH");

        uint256 tokensPerETH = quoteBuy(msg.value);
        uint256 tokenAmount = (msg.value * tokensPerETH) / 1e18;

        require(balanceOf(address(this)) >= tokenAmount, "sold out");

        _transfer(address(this), msg.sender, tokenAmount);
        emit TokensPurchased(msg.sender, tokenAmount, tokensPerETH);
    }

    function sellTokens(uint256 tokenAmount) external {
        require(balanceOf(msg.sender) >= tokenAmount, "insufficient balance");

        uint256 tokensPerETH = quoteSell(tokenAmount);
        uint256 ethAmount = (tokenAmount * 1e18) / tokensPerETH;

        require(address(this).balance >= ethAmount, "insufficient liquidity");

        _transfer(msg.sender, address(this), tokenAmount);
        payable(msg.sender).transfer(ethAmount);

        emit TokensSold(msg.sender, tokenAmount, tokensPerETH);
    }

    function addLiquidity() external payable onlyOwner {
        require(msg.value > 0, "send ETH");
        uint256 tokenAmount = msg.value;
        _transfer(address(this), developer, tokenAmount);
        emit LiquidityAdded(tokenAmount, msg.value);
    }

    function getCurrentPrice() public view returns (uint256 tokensPerETH) {
        uint256 remainingTokens = balanceOf(address(this));
        uint256 contractETHBalance = address(this).balance;
        if (contractETHBalance < 0.01 ether) {
            contractETHBalance = 0.01 ether;
        }
        tokensPerETH = (remainingTokens * 1e18) / contractETHBalance;
    }

    function quoteBuy(
        uint256 ethAmount
    ) public view returns (uint256 tokensPerETH) {
        uint256 currentTokensPerETH = getCurrentPrice();
        uint256 tokenAmount = (ethAmount * currentTokensPerETH) / 1e18;
        uint256 remainingTokens = balanceOf(address(this));

        tokensPerETH =
            ((remainingTokens - (tokenAmount / 2)) * 1e18) /
            (address(this).balance + (ethAmount / 2));
    }

    function quoteSell(
        uint256 tokenAmount
    ) public view returns (uint256 tokensPerETH) {
        uint256 currentTokensPerETH = getCurrentPrice();
        uint256 ethAmount = (tokenAmount * 1e18) / currentTokensPerETH;
        uint256 remainingTokens = balanceOf(address(this));

        tokensPerETH =
            ((remainingTokens + (tokenAmount / 2)) * 1e18) /
            (address(this).balance - (ethAmount / 2));
    }
}
