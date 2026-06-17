# Requirements Template

Template for `.frontier-app/REQUIREMENTS.md` — checkable requirements that define "done."

<template>

```markdown
# Requirements: {{APP_NAME}}

**Defined:** {{DATE}}
**Core Value:** [from PROJECT.md]

## {{MILESTONE_VERSION}} Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Platform Integration (Standard)

Every Frontier OS app ships with these. Non-negotiable.

- [ ] **PLAT-01**: App detects iframe context and adjusts behavior accordingly
- [ ] **PLAT-02**: App renders correctly in standalone mode as fallback
- [ ] **PLAT-03**: App uses dark theme matching Frontier OS visual language
- [ ] **PLAT-04**: All external API calls handle CORS correctly
- [ ] **PLAT-05**: SdkProvider wraps the entire app, SDK initializes on mount
- [ ] **PLAT-06**: App loads through the local Frontier PWA at `/apps/<appId>` and SDK bridge calls work in-frame

### [Feature Category 1]

- [ ] **REQ-01**: [Requirement description — user-centric, testable, atomic]
- [ ] **REQ-02**: [Requirement description]
- [ ] **REQ-03**: [Requirement description]

### [Feature Category 2]

- [ ] **REQ-04**: [Requirement description]
- [ ] **REQ-05**: [Requirement description]

### [Feature Category N]

- [ ] **REQ-NN**: [Requirement description]

## Future Milestone Requirements

Deferred to a later milestone. Tracked but not in current roadmap.

### [Category]

- **REQ-XX**: [Requirement description]
- **REQ-YY**: [Requirement description]

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Custom auth flows | Identity provided by Frontier OS |
| Direct API calls to Frontier services | Must use SDK — no bypassing the access layer |
| [Feature] | [Why excluded] |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 1 | Pending |
| PLAT-02 | Phase 1 | Pending |
| PLAT-03 | Phase 1 | Pending |
| PLAT-04 | Phase 1 | Pending |
| PLAT-05 | SDK Integration | Pending |
| PLAT-06 | SDK Integration | Pending |
| REQ-01 | Phase [N] | Pending |

**Coverage:**
- Total requirements: [X]
- Mapped to phases: [Y]
- Unmapped: [Z]

---
*Requirements defined: {{DATE}}*
*Last updated: {{DATE}} after {{TRIGGER}}*
```

</template>

<guidelines>

**Standard Platform Requirements:**
- PLAT-01 through PLAT-06 are ALWAYS included for every Frontier OS app
- PLAT-01 through PLAT-04 map to Phase 1 (Scaffold + Standalone Shell)
- PLAT-05 and PLAT-06 map to the final SDK Integration phase
- They are non-negotiable — an app without these cannot run in Frontier OS

**Requirement Format:**
- ID: `[CATEGORY]-[NUMBER]` (REQ-01, WALL-02, EVNT-03)
- Description: User-centric, testable, atomic
- Checkbox: Only for current milestone requirements (future milestones are not yet actionable)

**Categories:**
- Derive from the app's feature areas
- Keep consistent with SDK module names where applicable
- PLAT = platform integration (always first, always standard)

**Out of Scope:**
- The first two exclusions (custom auth, direct API calls) are ALWAYS present
- Add app-specific exclusions during /fos:new-app
- Include reasoning to prevent re-adding later

**Traceability:**
- PLAT requirements always map to Phase 1
- Feature requirements map to subsequent phases
- Updated during roadmap creation and after each phase completes

**Status Values:**
- Pending: Not started
- In Progress: Phase is active
- Complete: Requirement verified
- Blocked: Waiting on external factor

</guidelines>

<evolution>

**After each phase completes:**
1. Mark covered requirements as Complete
2. Update traceability status
3. Note any requirements that changed scope

**After roadmap updates:**
1. Verify all current milestone requirements are mapped
2. Add new requirements if scope expanded
3. Move requirements to future milestone or out of scope if descoped

</evolution>
