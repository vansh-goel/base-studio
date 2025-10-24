// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ExperienceNFT
 * @notice Soulbound-style NFT that evolves as experience points increase.
 */
contract ExperienceNFT is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    struct LevelConfig {
        uint256 xpThreshold;
        string metadataURI;
    }

    struct AvatarProgress {
        uint256 xp;
        uint8 levelIndex;
    }

    LevelConfig[] public levels;

    mapping(uint256 => AvatarProgress) private _progress;
    mapping(address => bool) public experienceManagers;
    mapping(uint256 => string) private _tokenURIs;

    event ExperienceManagerSet(address indexed manager, bool allowed);
    event ExperienceEarned(
        uint256 indexed tokenId,
        address indexed user,
        uint256 amount,
        uint8 newLevel
    );
    event AvatarMinted(uint256 indexed tokenId, address indexed owner);

    modifier onlyManager() {
        require(
            experienceManagers[msg.sender] || msg.sender == owner(),
            "not manager"
        );
        _;
    }

    constructor(
        uint256[] memory xpThresholds,
        string[] memory metadataURIs
    ) ERC721("0rbit Creator Avatar", "0RBIT") Ownable(msg.sender) {
        require(
            xpThresholds.length > 0 &&
                xpThresholds.length == metadataURIs.length,
            "levels required"
        );
        for (uint256 i = 0; i < xpThresholds.length; i++) {
            if (i > 0) {
                require(
                    xpThresholds[i] > xpThresholds[i - 1],
                    "threshold order"
                );
            }
            levels.push(
                LevelConfig({
                    xpThreshold: xpThresholds[i],
                    metadataURI: metadataURIs[i]
                })
            );
        }
    }

    function setExperienceManager(
        address manager,
        bool allowed
    ) external onlyOwner {
        experienceManagers[manager] = allowed;
        emit ExperienceManagerSet(manager, allowed);
    }

    function mint(address to) external onlyManager returns (uint256 tokenId) {
        _tokenIdCounter.increment();
        tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
        _progress[tokenId] = AvatarProgress({xp: 0, levelIndex: 0});
        _tokenURIs[tokenId] = levels[0].metadataURI;
        emit AvatarMinted(tokenId, to);
    }

    function earnExperience(
        uint256 tokenId,
        uint256 amount
    ) external onlyManager {
        require(_ownerOf(tokenId) != address(0), "unknown avatar");
        require(amount > 0, "amount zero");

        AvatarProgress storage progress = _progress[tokenId];
        progress.xp += amount;

        uint8 newLevel = progress.levelIndex;
        for (uint8 i = progress.levelIndex + 1; i < levels.length; i++) {
            if (progress.xp >= levels[i].xpThreshold) {
                newLevel = i;
            }
        }

        if (newLevel != progress.levelIndex) {
            progress.levelIndex = newLevel;
            _tokenURIs[tokenId] = levels[newLevel].metadataURI;
        }

        emit ExperienceEarned(
            tokenId,
            ownerOf(tokenId),
            amount,
            progress.levelIndex
        );
    }

    function updateLevelMetadata(
        uint8 levelIndex,
        string calldata uri
    ) external onlyOwner {
        require(levelIndex < levels.length, "invalid level");
        levels[levelIndex].metadataURI = uri;
    }

    function addNewLevel(
        uint256 xpThreshold,
        string calldata uri
    ) external onlyOwner {
        require(
            xpThreshold > levels[levels.length - 1].xpThreshold,
            "threshold too low"
        );
        levels.push(LevelConfig({xpThreshold: xpThreshold, metadataURI: uri}));
    }

    function avatarProgress(
        uint256 tokenId
    ) external view returns (AvatarProgress memory) {
        require(_ownerOf(tokenId) != address(0), "unknown avatar");
        return _progress[tokenId];
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "unknown avatar");
        return _tokenURIs[tokenId];
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("soulbound");
        }
        return super._update(to, tokenId, auth);
    }
}
