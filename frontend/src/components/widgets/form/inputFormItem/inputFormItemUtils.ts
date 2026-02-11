export type ValidationStatus<Valid extends Record<string, any> | never = never, Invalid extends Record<string, any> | never = never> =
    | ([Valid] extends [never] ? {type: 'valid'} : {type: 'valid'} & Valid)
    | ([Invalid] extends [never] ? {type: 'invalid'} : {type: 'invalid'} & Invalid);

export type ExtractValidStatus<T> = T extends {type: 'valid'} & infer V ? V : never;
