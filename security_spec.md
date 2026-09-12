# ResearchMind Security Specification

## Data Invariants
1. A research document must belong to the user who created it (`userId` matches `request.auth.uid`).
2. Sources and messages belong to a specific research and inherit its access permissions.
3. User profiles are only writable by the owner.
4. Status transitions for research should be logically progressive (though client-side updates are allowed for simplicity in this agent-driven flow).
5. All IDs must match standard patterns.
6. All strings must have length limits.

## The Dirty Dozen Payloads (Rejection Tests)
1. **Unauthenticated Write**: Creating a research document without being logged in.
2. **Identity Spoofing**: Creating a research document with a `userId` that doesn't match the current user's UID.
3. **Cross-User Read**: Attempting to read another user's research document.
4. **Invalid Status**: Setting a status that is not part of the allowed enum (e.g., `status: 'hacked'`).
5. **Missing Required Fields**: Creating a research document without the `query` field.
6. **Oversized String**: Sending a `query` string longer than 2000 characters.
7. **Orphaned Source**: Creating a source for a research document that doesn't exist.
8. **Unauthorized Source Creation**: Creating a source for another user's research.
9. **Message Role Spoofing**: Sending a message with a role other than 'user' or 'assistant'.
10. **Profile Modification**: Attempting to update another user's profile.
11. **Impersonation**: Updating a profile's `email` to one that doesn't match the authenticated user.
12. **Status Locking Bypass**: (If implemented) Attempting to update a research document once it's in a terminal state like 'completed' (except for chat messages).

## Test Runner Plan
I will implement rules that ensure these payloads are denied.
