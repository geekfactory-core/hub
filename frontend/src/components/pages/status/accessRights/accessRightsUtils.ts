import {unionToArray, type KeysOfUnion} from 'frontend/src/utils/core/typescript/typescriptAddons';
import type {Permission} from 'src/declarations/hub/hub.did';

export const allAccessRightPermissions = unionToArray<KeysOfUnion<Permission>>()('BlockContractTemplate', 'AddContractTemplate', 'SetAccessRights', 'SetConfig');
