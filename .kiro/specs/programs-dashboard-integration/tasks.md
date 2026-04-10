# Implementation Plan: Programs Dashboard Integration

## Overview

Replace the existing Projects dashboard frontend (backed by `project_posts`) with a new implementation reading from/writing to the `programs` and `program_sections` Supabase tables. Work proceeds bottom-up: types → hook → components, with each step building on the previous one.

## Tasks

- [x] 1. Define types and update Supabase database types
  - [x] 1.1 Add `programs`, `program_sections` table definitions and `section_key_type` ENUM to `src/integrations/supabase/types.ts`
    - Add Row, Insert, and Update types for `programs` table (id, title, slug, program_type, location, date, status, image_url, banner_url, short_description, display_order, is_active, created_at, updated_at)
    - Add Row, Insert, and Update types for `program_sections` table (id, program_id, section_key, title, content, display_order, created_at, updated_at)
    - Add `section_key_type` to the Enums section with all 14 values
    - Add foreign key relationship from `program_sections.program_id` to `programs.id`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Create `src/types/program.ts` with Program, ProgramSection, ProgramFormData, ProgramSectionFormData, and SectionKeyType types
    - Define `SectionKeyType` union of 14 ENUM string literals
    - Define `Program` interface with all `programs` table columns plus `sections: ProgramSection[]`
    - Define `ProgramSection` interface with all `program_sections` table columns
    - Define `ProgramFormData` and `ProgramSectionFormData` interfaces for form submission
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 1.3 Update `src/components/Projects/shared/ProjectFormTypes.ts` with program form types
    - Replace or extend with `ProgramFormData`, `ProgramFormProps`, and `ProgramValidationErrors` types
    - _Requirements: 2.3_

- [x] 2. Implement usePrograms hook
  - [x] 2.1 Create `src/hooks/usePrograms.ts` with fetch, create, update, delete, and getById operations
    - Implement `fetchPrograms` using `supabase.from('programs').select('*, program_sections(*)').order('display_order').order('created_at', { ascending: false })`
    - Implement `createProgram` that inserts program row then batch-inserts sections with returned program ID
    - Implement `updateProgram` that updates program row, upserts sections on `(program_id, section_key)`, and deletes removed sections
    - Implement `deleteProgram` with ownership check (user_id match or owner role) and cascade delete
    - Implement `getProgramById` with nested section select
    - Follow existing `useProjects` patterns: useState, useCallback, useEffect, useToast, useAuth, useUserRole
    - Include slug auto-generation helper: lowercase, replace non-alphanumeric with hyphens, trim leading/trailing hyphens, collapse consecutive hyphens
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 2.2 Export `usePrograms` from `src/hooks/index.ts`
    - _Requirements: 7.2_

  - [ ]* 2.3 Write property test: Fetch ordering invariant (Property 1)
    - **Property 1: Fetch ordering invariant**
    - Generate random arrays of `{display_order, created_at}` and verify sorted order matches expected (display_order ASC, created_at DESC)
    - **Validates: Requirements 3.1**

  - [ ]* 2.4 Write property test: Slug generation produces URL-friendly strings (Property 6)
    - **Property 6: Slug generation produces URL-friendly strings**
    - Generate random non-empty strings and verify slug matches `/^[a-z0-9]+(-[a-z0-9]+)*$/`
    - **Validates: Requirements 4.3**

  - [ ]* 2.5 Write property test: Empty required fields are rejected (Property 7)
    - **Property 7: Empty required fields are rejected**
    - Generate whitespace-only strings for title and verify form submission is rejected
    - **Validates: Requirements 4.5**

- [x] 3. Checkpoint - Ensure types and hook compile correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update Dashboard Overview component
  - [x] 4.1 Update `src/components/Projects/Dashboard/DashboardOverview.tsx` to use Program types and program-specific metrics
    - Change props from `ProjectPost[]` to `Program[]`
    - Replace "Tags" metric card with "Active Programs" count (where `is_active === true`)
    - Keep "Total Programs" and "This Month" metric cards, update labels
    - Update recent programs list to show status/program_type badges instead of tags/videos
    - Update "New Project" button text to "New Program"
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 4.2 Write property test: Dashboard metrics correctness (Property 9)
    - **Property 9: Dashboard metrics correctness**
    - Generate random programs with varied `is_active` and `created_at`, verify total/active/this-month counts
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 5. Replace program creation/edit form
  - [x] 5.1 Rewrite `src/components/Projects/NewPost/NewPostSection.tsx` as the program form
    - Replace TipTap editor and SEO fields with program metadata inputs: title, slug (auto-generated), short_description, image_url, banner_url
    - Add settings sidebar: program_type (text), location (text), date (date picker), status (select: Active/Completed/In Progress), display_order (number), is_active (checkbox)
    - Add dynamic sections area: dropdown to add section_key (excluding already-added keys), each section has title input + content textarea, sections can be removed
    - Implement form validation: require title and slug, show inline error messages
    - Pre-populate all fields when editing an existing program
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 5.2 Update `src/components/Projects/NewPost/ProjectPostManager.tsx` to use `usePrograms` and `Program` types
    - Replace `useProjects` with `usePrograms`
    - Convert form data to `ProgramFormData` before calling create/update
    - Update prop types from `ProjectPost` to `Program`
    - _Requirements: 3.3, 3.4, 7.4_

  - [ ]* 5.3 Write property test: Edit form pre-population round-trip (Property 8)
    - **Property 8: Edit form pre-population round-trip**
    - Generate random Program with sections, verify form field values match program metadata and section data
    - **Validates: Requirements 4.6**

- [x] 6. Update programs list and detail view
  - [x] 6.1 Update `src/components/Projects/PostedPosts/PostedPostsSection.tsx` to display programs with status/type/location badges
    - Change props from `ProjectPost[]` to `Program[]`
    - Replace tag-based filtering with status dropdown filter
    - Update search to filter by title and short_description
    - Update card rendering: show image_url, title, short_description, program_type badge, status badge, location, date
    - Update detail dialog to show all program metadata and program_sections ordered by display_order
    - Remove TipTap content rendering, replace with sections display
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 6.2 Update `src/components/Projects/PostedPosts/ProjectList.tsx` to receive programs as props instead of calling its own hook
    - Change from using internal `useProjects` to receiving `Program[]` as props
    - Update card rendering to show program-specific fields (status, program_type, location badges)
    - _Requirements: 6.1, 7.1_

  - [ ]* 6.3 Write property test: Program list filtering (Property 10)
    - **Property 10: Program list filtering**
    - Generate programs + random search/status filter, verify filtered results match criteria (case-insensitive title/short_description search AND status match)
    - **Validates: Requirements 6.2, 6.3**

- [x] 7. Wire everything together in the dashboard page
  - [x] 7.1 Update `src/components/Projects/ProjectsDashboardPage.tsx` to use `usePrograms` and `Program` types
    - Replace `useProjects` import with `usePrograms`
    - Replace `ProjectPost` type references with `Program`
    - Update section labels from "Projects" to "Programs"
    - Pass programs to DashboardOverview, PostedPostsSection, and ProgramPostManager
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 8. Final checkpoint - Ensure all components compile and integrate correctly
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use fast-check and validate universal correctness properties
- The existing file structure under `src/components/Projects/` is preserved
