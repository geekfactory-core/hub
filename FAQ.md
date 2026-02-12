# FAQ

This document contains frequently asked questions about the Hub.
It is a living document and may be updated as new questions arise.

## General Overview

### What is the GeekFactory Smart Contract Hub?
The GeekFactory Smart Contract Hub lets users deploy their own independent smart contracts on the Internet Computer — each running in its own canister and not controlled by any central authority.
Instead of using one shared contract managed by a team or DAO, users select a template from the Hub and deploy it as a separate canister with no controller by default.
Each deployed contract is issued a certificate with a fixed expiration date. The contract’s code may use the certificate validity window to restrict actions such as adding a controller and changing the contract code through upgrades, making the contract temporarily and verifiably immutable.
This setup lets users rely on code — not on intermediaries, the Hub, a team, or a DAO.

### What is the Hub NOT?
The Hub does not store user assets, execute contract logic, or interfere with deployed contracts. 
After deployment, each contract runs in its own isolated canister with no connection to the Hub. The Hub cannot access the contract’s state, assign a controller, or change its behavior.
By design, the Hub’s role ends at deployment. Everything that happens after that is governed entirely by the contract’s own code.

### Why does the Hub exist?
Most smart contracts that handle valuable assets are either upgradeable or centrally controlled — even when they’re open source or governed by a DAO.
This creates a structural risk:
- If a contract can be upgraded, its behavior can be changed later
- If upgrades are managed by a DAO, the DAO becomes a target
- The more value a contract holds, the more incentive there is to take over governance
The Hub provides an alternative: instead of using shared or upgradeable logic, users deploy isolated contracts with no controller and optionally verifiable immutability.
This model supports contracts that are:
- Isolated — one per use case, not shared or multiplexed
- Locked — upgrade-restricted for a specific period based on certificate settings and contract logic
- Verifiable — anyone can inspect the deployed code, rebuild the template, and check that the logic matches what’s claimed
Instead of trusting a team, DAO, or platform, users rely on code they can inspect, verify, and decide whether to trust.

### Why is DAO governance not enough?
DAO-based governance reduces reliance on individuals, but it doesn’t eliminate trust entirely. If a DAO has the ability to upgrade contracts or access assets, several problems can still arise:
- Governance tokens can be targeted through attacks, market manipulation, or theft
- Voting processes can be influenced by whales, bribes, or off-chain coordination
- Even well-meaning governance can make harmful changes due to pressure, mistakes, or unclear incentives
For contracts that manage valuable assets or require strict guarantees, this residual trust becomes a risk — especially when the consequences of a governance decision are irreversible.

### Does the Hub have access to deployed contracts or user assets?
No. Once a contract is deployed, it runs in its own canister with no connection to the Hub. The Hub cannot access the contract’s state, upgrade its logic, execute any functions, or interact with its assets.
Each contract operates independently. Even if the Hub is upgraded, blocked, or taken offline, already deployed contracts continue to run on their own — unaffected by any changes to the Hub itself.

### Is the Hub transparent?
Yes. The Hub is designed to be inspectable and observable. Its source code is publicly available, and on-chain actions are recorded and visible.
Specifically:
- The Hub’s codebase can be reviewed to understand how it deploys contracts and manages templates
- Each deployment is logged on-chain, including the template used and the deploying principal
- The transaction used to pay for deployment is also visible, including the source of payment
- Changes to settings or template listings are recorded and can be traced over time
This makes it possible to review how the Hub operates, what contracts were deployed, and under which configuration.

## Deploying and Activating a Contract

### How do I deploy a contract?
To deploy a contract, select a template from the Hub and follow the deployment flow.
Before continuing, you’re expected to review the template’s settings, license, terms of use, and especially the contract code — since only the code defines how the contract will behave on-chain.
Each deployment requires a one-time ICP payment using your OISY Wallet. This amount is converted into cycles required for the deployment operation and funding the contract canister.
Once confirmed, the Hub:
- Creates a new canister
- Deploys the code from the selected template
- Funds the canister with the cycle amount specified in the template
- Issues a certificate with an expiration timestamp specified in the template
- Provides a link to a contract canister and activation instructions if activation is required
After deployment, the contract runs as an independent canister on the Internet Computer, separate from the Hub and governed entirely by its own code.

### How much does it cost to deploy a contract?
The deployment cost is calculated in ICP and depends on the current ICP-to-cycles conversion rate. The amount covers:
- Contract canister creation and deployment costs
- Funding the canister with the cycle amount specified in the selected template
The exact amount is shown before deployment. All payments are handled via OISY Wallet during the deployment process.

### Can a deployed contract be upgraded?
Whether a contract can be upgraded depends entirely on its code.
Some templates are written to block upgrades during the certificate period — for example, by rejecting any attempt to assign a controller while the certificate is still valid.
Once the certificate expires, the restrictions defined in the contract may no longer apply. Typically, the contract owner gains the ability to add a controller and upgrade the code.

### How do I activate a contract?
After deployment, the Hub provides an activation instructions with a unique activation code.
To activate the contract:
1. Open the deployed contract
2. Log in to the contract
3. Enter the activation code
This assigns ownership of the contract to you.

### Why do I need to activate the contract?
On the Internet Computer, Internet Identity generates a unique principal for each canister. Because of this, the contract cannot automatically know who deployed it. Activation is the process of claiming the contract using the activation code provided by the Hub. It links your identity to the deployed contract and assigns ownership to you.

## Certificates and Immutability

### What is a contract certificate and what happens after expiration?
Each deployed contract is issued a certificate — a signed record that includes the contract’s deployment metadata and an expiration timestamp. It indicates that the contract was deployed via the Hub from a specific template and shows until when the certificate is considered valid.
Templates may use this timestamp as part of their logic to restrict controller changes during the certificate period. After the expiration date, such restrictions may no longer apply — depending on how the contract is written.
The certificate period is flexible and can be adapted to different use cases:
- For contracts that require full immutability, the expiration date can be set far in the future (e.g. hundreds of years), effectively locking the logic forever
- For personal or experimental contracts that don’t involve others and are meant to be upgraded freely, the certificate can be set to expire immediately
- For contracts that need a temporary trustless phase — for example, while holding assets or coordinating interactions between users — a specific immutability period can be chosen, such as days or weeks, to balance safety and recoverability

### Why do contracts need to be immutable?
For some use cases, it’s important to ensure that the contract logic cannot be changed after deployment — even by the developer or a DAO. This is especially relevant when contracts manage valuable assets or coordinate interactions between independent parties.
By removing upgrade paths and locking logic for a defined period, contracts can guarantee predictable behavior and eliminate trust in external actors. Users can inspect the code once and rely on it without needing to monitor future changes.

### Why aren’t all contracts permanently immutable?
Some templates can be configured so that the certificate never expires. If the contract logic also blocks controller assignment, this creates a permanently locked contract that cannot be changed or upgraded by anyone. This model may be suitable for very simple, self-contained contracts.
In other cases, permanent immutability can be risky. If a bug is discovered, or if something breaks due to changes in external dependencies or protocol behavior, there’s no way to fix it.
Using a certificate with a fixed expiration allows contracts to remain immutable during a defined window, while still giving the owner a recovery path after that period ends.

### Can a certificate be extended?
No. Once a contract is deployed, its certificate has a fixed expiration timestamp defined by the template. It cannot be extended, renewed, or replaced.
If different immutability durations are needed, this must be handled by using different templates with predefined expiration periods.
In the future, the Hub may support alternative certificate models that allow extensions — but this is not currently implemented and should not be assumed.

### Can a certificate be revoked early?
No. Once issued, a certificate remains valid until its expiration timestamp. There is no mechanism to revoke or shorten it after deployment.
This ensures that any logic relying on the certificate has a stable and predictable reference period.

## Validation and Security

### Why do I always need to validate a contract?
Validation is the easiest way to confirm that you’re interacting with a real contract deployed through the Hub — not a phishing copy or lookalike interface.
It shows:
- That the contract was deployed from a known Hub template
- That the certificate exists and is still valid
- That the contract is activated
- That the original template hasn’t been blocked
This check helps you avoid contracts that were deployed manually, modified after expiration, or built to mimic trusted logic. However, validation doesn’t replace reviewing the code. You should always verify how the contract handles ownership, upgrades, and certificate-based restrictions — especially if immutability matters for your use case.

### How to validate a contract on the Hub?
Copy the full URL of the contract (e.g. https://[canisterID].icp0.io) and open the GeekFactory Hub.
Go to the Validate Contract section, paste the URL, and run the check.
You’ll see a summary showing whether the contract was deployed via the Hub, which template was used, and whether the certificate is still valid.

### Does validation guarantee the contract is safe?
No. Validation is not a security audit. It only checks surface-level metadata — it shows that the contract was deployed through the Hub, from a listed template, and whether its certificate is still valid.
This is useful for detecting fakes, expired contracts, or deployments from blocked templates. But it does not prove that the contract is safe or bug-free.
Full verification should include:
- Checking the certificate metadata to confirm that the contract was deployed through the Hub and to identify its template and expiration date
- Building the template locally and comparing the resulting WASM module with the deployed one
- Ensuring that the contract canister doesn’t have external controllers
- Reviewing the code logic that governs controller assignment
- Reading and understanding the contract’s source code to see how it behaves in different conditions
Only the contract code determines actual on-chain behavior. If immutability or safety is important, you should always verify the code yourself — validation is just the first step.

### What does it mean if a contract’s certificate is invalid or expired?
If the certificate is expired, the contract is no longer within the certificate period defined at deployment. If the contract logic allows it, the owner may now add a controller and upgrade the code.
If the certificate is invalid, it means the Hub can’t match the deployed contract to its original deployment record. This usually means the contract code was already changed.

### Why can a template be blocked?
A template may be blocked if a critical vulnerability or design flaw is discovered. This prevents new contracts from being deployed from that template through the Hub.
Blocking a template does not affect contracts that were already deployed. Any behavior change in deployed contracts — such as disabling features or showing warnings — depends entirely on the contract code.

### What can go wrong if I skip validation?
Without validation, you may interact with a contract that was never deployed through the Hub, has already been modified, or uses a blocked or expired template. In some cases, this can mean malicious logic, hidden upgrade paths, or phishing behavior.
Validation doesn’t guarantee safety — but skipping it removes your first line of defence.

## Governance and Ecosystem

### Who governs the Smart Contract Hub?
During the beta phase, the Hub is managed by the GeekFactory team.
During the beta phase, governance of the Hub is handled by the GeekFactory team. This includes actions like listing or blocking templates, adjusting configuration, and making code changes.
In the future, governance may be transferred to a DAO — either via SNS or another decentralisation model.

### Can developers earn from publishing templates?
After the transition to DAO governance, external developers will be able to propose their own templates for listing. The DAO will decide whether to list them through on-chain governance.
Developers can include monetization logic directly in their templates — for example:
- Transaction fees
- One-time activation costs
- Subscriptions or usage-based pricing

### Can third-party services build on top of the Hub?
Yes. Because contracts deployed through the Hub are public on-chain canisters, third-party services may build tools such as storefronts, indexers, explorers, analytics dashboards, or other interfaces that interact with deployed contracts.
Some templates may include optional referral logic that allows such services to receive a portion of fees when users access a contract through them.
The Hub does not control or operate these services. Any referral mechanism, if present, is defined by the template code itself.
