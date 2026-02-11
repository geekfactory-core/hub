# GeekFactory Smart Contract Hub

The GeekFactory Smart Contract Hub is an on-chain deployment layer for smart contracts on the Internet Computer.

The Hub enables users to deploy independent contract instances from listed templates, instead of relying on shared contracts, upgradeable systems, or centrally managed marketplaces. Each deployment results in a separate canister with its own code, state, and lifecycle.

Contracts deployed through the Hub are issued a certificate at deployment time. This certificate records deployment metadata, including the template used and a fixed expiration timestamp. Contract templates may use this certificate period as part of their logic — for example, to restrict controller assignment and code upgrades while the certificate is valid.

Deployed contracts do not depend on the Hub for execution. Changes to the Hub — including upgrades, governance actions, or unavailability — do not affect already deployed contracts.

The Hub is intended for use cases where users want to rely on inspectable and verifiable on-chain code, rather than on off-chain platforms, operators, or governance decisions, for defining how a contract behaves.

## RESOURCES

- [License](LICENSE)
- [Terms of Use](TERMS.md)
- [FAQ](FAQ.md)
