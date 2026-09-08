// Approval-gate helper. In v1 every consequential action listed here always
// requires a manual owner action, in every Operating Mode — see
// ../../docs/approval-policy-matrix.md for the full v1-vs-target matrix and
// why this is a deliberate simplification, not an oversight.
//
// Every route handler that performs a payment, delivery, or QA/red-team
// sign-off action should reference this constant (or, once the real
// approval-policy engine exists, call a function here) rather than hardcode
// "true" inline — so upgrading this file is the only change needed later.
export const ALWAYS_REQUIRES_OWNER_APPROVAL = true as const;
