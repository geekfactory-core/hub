export const skipMessage = (logMessagePrefix: string, obj: string) => `${logMessagePrefix} skip - ${obj}`;
export const notOwnerMessage = (logMessagePrefix: string) => `${logMessagePrefix} skip - not owner`;
export const caughtErrorMessage = (logMessagePrefix: string) => `${logMessagePrefix} caught error`;
export const delegationExpiredWillLogoutMessage = 'Delegation expired. Will logout.';
export const exhaustiveCheckFailedMessage = 'Exhaustive check failed.';
