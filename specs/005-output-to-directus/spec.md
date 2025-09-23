# Feature Specification: Output to Directus

**Feature Branch**: `005-output-to-directus`
**Created**: 2025-09-21
**Status**: Draft
**Input**: User description: "005-output"

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a Manager, after I have curated a shortlist of cards for the newsletter, I want to publish them to our Directus CMS so they can be included in the final newsletter.

### Acceptance Scenarios
1. **Given** I have a set of shortlisted cards for an issue, **When** I click the "Publish to Directus" button, **Then** the content of each card is sent to our Directus CMS.
2. **Given** a card has been successfully published to Directus, **When** I view the card in the AI Digest app, **Then** I can see a status indicator showing it is "synced" and a link to the entry in Directus.
3. **Given** a card that was previously synced is updated in the AI Digest app, **When** I publish the issue again, **Then** the existing entry in Directus is updated with the new content.

### Edge Cases
- **What happens when** the Directus API is unavailable? The system should show an error, mark the cards as `export_failed`, and allow me to retry the export later.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: The system MUST provide a mechanism for a Manager to trigger the publishing of shortlisted cards to Directus.
- **FR-002**: The system MUST map the card data (title, summary, author, etc.) to the corresponding fields in the target Directus collection.
- **FR-003**: The system MUST be able to create new entries in Directus for new cards.
- **FR-004**: The system MUST be able to update existing entries in Directus if a card has been published before.
- **FR-005**: The system MUST store the Directus entry ID on the card record after a successful export.
- **FR-006**: The system MUST display the sync status of a card (e.g., `not exported`, `pending`, `synced`, `error`).
- **FR-007**: The system MUST handle export failures gracefully and allow for retries.

### Key Entities *(include if feature involves data)*
- **Card**: The source of the content to be published.
- **Issue**: A collection of shortlisted cards that are published together.
- **Directus Entry**: The record created or updated in the external Directus CMS.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---
