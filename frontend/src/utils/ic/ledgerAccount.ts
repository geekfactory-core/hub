import {AccountIdentifier} from '@dfinity/ledger-icp';
import type {LedgerAccount} from 'src/declarations/hub/hub.did';
import {hasProperty} from '../core/typescript/typescriptAddons';
import {type AccountVariant, icrcAccountToAccount} from './account';

export const accountVariantToLedgerAccount = (accountVariant: AccountVariant): LedgerAccount => {
    return hasProperty(accountVariant, 'accountIdentifierHex')
        ? {
              AccountIdentifier: {
                  slice: AccountIdentifier.fromHex(accountVariant.accountIdentifierHex).toUint8Array()
              }
          }
        : {
              Account: icrcAccountToAccount(accountVariant.icrcAccount)
          };
};
