import type {IcrcTokenMetadataResponse} from '@dfinity/ledger-icrc';
import {IcrcMetadataResponseEntries} from '@dfinity/ledger-icrc';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';

export const getICRCTokenLogo = (metadata: IcrcTokenMetadataResponse | undefined): string | undefined => {
    return getICRCTokenText(metadata, IcrcMetadataResponseEntries.LOGO);
};

type ICRCTokenValueType = IcrcTokenMetadataResponse[number][1];

const getICRCTokenText = (metadata: IcrcTokenMetadataResponse | undefined, key: IcrcMetadataResponseEntries): string | undefined => {
    if (metadata == undefined) {
        return undefined;
    }
    const item = metadata.find(([k, _]) => k == key);
    const value: ICRCTokenValueType | undefined = item?.[1];
    if (value != undefined && hasProperty(value, 'Text')) {
        return value.Text;
    }
    return undefined;
};
