declare module "dcraw" {
    type DcrawInput = Buffer | Uint8Array;
    interface DcrawOptions {
        [key: string]: unknown;
    }

    function dcraw(input: DcrawInput, options?: DcrawOptions): Buffer | Uint8Array;

    export = dcraw;
}


