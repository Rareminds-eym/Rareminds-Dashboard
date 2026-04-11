# Requirements Document

## Introduction

This feature integrates the existing frontend Projects dashboard page with the new Supabase `programs` and `program_sections` tables. The current Projects page reads from a `project_posts` table with a flat data model (title, tags, content_json, SEO fields). The new schema introduces a `programs` table with different metadata fields (program_type, location, date, status, image_url, banner_url, short_description, display_order, is_active) and a related `program_sections` table for dynamic section-based content keyed by a `section_key` ENUM. The goal is to re-align the frontend types, hooks, form inputs, and display components so they read from and write to the new `programs`/`program_sections` tables while maintaining the existing code structure and UI patterns.

## Glossary

- **Dashboard**: The main Projects dashboard page (`ProjectsDashboardPage.tsx`) containing overview, new program creation, and program listing sections.
- **Program**: A record in the `programs` Supabase table representing a program with metadata such as title, slug, program_type, location, date, status, image_url, banner_url, short_description, display_order, and is_active.
- **Program_Section**: A record in the `program_sections` Supabase table representing a content section belonging to a Program, identified by a `section_key` ENUM value.
- **Section_Key**: An ENUM type (`section_key_type`) with values: 'introduction', 'about', 'modules', 'approaches', 'impact', 'strategic_alignment', 'conclusion', 'header', 'course_enrollment', 'programs', 'why', 'cloud_kitchen', 'agri_food', 'inventions'.
- **Supabase_Client**: The typed Supabase client instance at `src/integrations/supabase/client.ts` used for all database operations.
- **Database_Types**: The auto-generated TypeScript types at `src/integrations/supabase/types.ts` that define the Database schema for type-safe Supabase queries.
- **Programs_Hook**: A custom React hook (`usePrograms`) that encapsulates all CRUD operations against the `programs` and `program_sections` tables.
- **Form_Component**: The program creation/edit form component that collects program metadata and section content from the user.
- **Overview_Component**: The dashboard overview component that displays program metrics and recent programs.
- **List_Component**: The component that displays all programs in a filterable, searchable grid.

## Requirements

### Requirement 1: Update Database Types for Programs Schema

**User Story:** As a developer, I want the Supabase Database types to include the `programs` and `program_sections` tables and the `section_key_type` ENUM, so that all Supabase queries are type-safe.

#### Acceptance Criteria

1. THE Database_Types SHALL include a `programs` table definition with Row, Insert, and Update types matching the columns: id (UUID), title (TEXT NOT NULL), slug (TEXT UNIQUE NOT NULL), program_type (TEXT nullable), location (TEXT nullable), date (DATE nullable), status (TEXT nullable), image_url (TEXT nullable), banner_url (TEXT nullable), short_description (TEXT nullable), display_order (INTEGER default 0), is_active (BOOLEAN default true), created_at (TIMESTAMP WITH TIME ZONE), updated_at (TIMESTAMP WITH TIME ZONE).
2. THE Database_Types SHALL include a `program_sections` table definition with Row, Insert, and Update types matching the columns: id (UUID), program_id (UUID NOT NULL), section_key (section_key_type NOT NULL), title (TEXT nullable), content (TEXT nullable), display_order (INTEGER default 0), created_at (TIMESTAMP WITH TIME ZONE), updated_at (TIMESTAMP WITH TIME ZONE).
3. THE Database_Types SHALL include a `section_key_type` ENUM definition with all 14 values: 'introduction', 'about', 'modules', 'approaches', 'impact', 'strategic_alignment', 'conclusion', 'header', 'course_enrollment', 'programs', 'why', 'cloud_kitchen', 'agri_food', 'inventions'.
4. THE Database_Types SHALL define the `program_sections` foreign key relationship referencing `programs.id` with cascade delete.

### Requirement 2: Create Frontend TypeScript Types for Programs

**User Story:** As a developer, I want dedicated TypeScript interfaces for Program and ProgramSection, so that the frontend components have clear, type-safe data contracts.

#### Acceptance Criteria

1. THE Dashboard SHALL define a `Program` interface with fields matching the `programs` table columns, using appropriate TypeScript types (string for UUID/TEXT, Date or string for DATE/TIMESTAMP, number for INTEGER, boolean for BOOLEAN).
2. THE Dashboard SHALL define a `ProgramSection` interface with fields matching the `program_sections` table columns, including `section_key` typed as a union of the 14 ENUM string literals.
3. THE Dashboard SHALL define a `ProgramFormData` interface containing all editable Program fields and an array of ProgramSection entries for form submission.
4. THE Dashboard SHALL define a `SectionKeyType` union type matching the 14 ENUM values for use across components.

### Requirement 3: Create Programs Data Hook

**User Story:** As a developer, I want a `usePrograms` hook that handles all CRUD operations for programs and their sections via Supabase, so that components can fetch, create, update, and delete programs.

#### Acceptance Criteria

1. THE Programs_Hook SHALL fetch all programs from the `programs` table ordered by `display_order` ascending, then `created_at` descending.
2. THE Programs_Hook SHALL fetch associated program_sections for each program using the `program_id` foreign key.
3. WHEN a new program is created, THE Programs_Hook SHALL insert a row into the `programs` table and insert corresponding rows into the `program_sections` table for each provided section.
4. WHEN an existing program is updated, THE Programs_Hook SHALL update the `programs` row and upsert the associated `program_sections` rows matching on `(program_id, section_key)`.
5. WHEN a program is deleted, THE Programs_Hook SHALL delete the program row from the `programs` table (cascade delete removes sections automatically).
6. IF a Supabase operation fails, THEN THE Programs_Hook SHALL return an error message and display a toast notification to the user.
7. THE Programs_Hook SHALL expose loading, error, and programs state to consuming components.

### Requirement 4: Build Program Creation and Edit Form

**User Story:** As a dashboard user, I want a form to create and edit programs with all metadata fields and dynamic section content areas, so that I can manage program data through the UI.

#### Acceptance Criteria

1. THE Form_Component SHALL provide input fields for: title (text, required), slug (text, auto-generated from title), program_type (text), location (text), date (date picker), status (select dropdown), image_url (text/upload), banner_url (text/upload), short_description (textarea), display_order (number), and is_active (toggle/checkbox).
2. THE Form_Component SHALL provide a sections area where each section_key from the ENUM is represented with a title input and a content textarea.
3. WHEN the user enters a title, THE Form_Component SHALL auto-generate a URL-friendly slug from the title value.
4. WHEN the form is submitted with valid data, THE Form_Component SHALL call the Programs_Hook create or update function with the collected ProgramFormData.
5. IF required fields (title, slug) are empty on submission, THEN THE Form_Component SHALL display validation error messages next to the respective fields.
6. WHEN editing an existing program, THE Form_Component SHALL pre-populate all fields with the program's current data including existing section content.

### Requirement 5: Update Dashboard Overview for Programs

**User Story:** As a dashboard user, I want the overview section to display program-specific metrics and recent programs, so that I can see a summary of my program portfolio.

#### Acceptance Criteria

1. THE Overview_Component SHALL display the total count of programs from the `programs` table.
2. THE Overview_Component SHALL display the count of active programs (where `is_active` is true).
3. THE Overview_Component SHALL display the count of programs created in the current month.
4. THE Overview_Component SHALL display a list of the 3 most recently created programs with their title, short_description, status, and image_url.
5. WHEN the user clicks "New Program", THE Overview_Component SHALL navigate to the program creation form section.
6. WHEN the user clicks "View All", THE Overview_Component SHALL navigate to the programs list section.

### Requirement 6: Update Programs List and Detail View

**User Story:** As a dashboard user, I want to browse, search, and filter published programs, and view their full details including all sections, so that I can manage the program catalog.

#### Acceptance Criteria

1. THE List_Component SHALL display all programs in a card grid layout showing image_url, title, short_description, program_type, status, location, and date.
2. THE List_Component SHALL provide a search input that filters programs by title and short_description.
3. THE List_Component SHALL provide a filter dropdown to filter programs by status.
4. WHEN the user clicks "View" on a program card, THE List_Component SHALL open a detail dialog displaying all program metadata and all associated program_sections ordered by display_order.
5. WHEN the user clicks "Edit" on a program card, THE Dashboard SHALL navigate to the Form_Component pre-populated with that program's data.
6. WHEN the user clicks "Delete" on a program card and confirms the action, THE Dashboard SHALL call the Programs_Hook delete function and remove the program from the list.

### Requirement 7: Maintain Existing Code Structure and Patterns

**User Story:** As a developer, I want the integration to follow the existing codebase conventions for file organization, component patterns, and hook patterns, so that the codebase remains consistent and maintainable.

#### Acceptance Criteria

1. THE Dashboard SHALL organize new program components under `src/components/Projects/` following the existing subfolder pattern (Dashboard/, NewPost/, PostedPosts/, shared/).
2. THE Dashboard SHALL place the `usePrograms` hook in `src/hooks/` and export it from `src/hooks/index.ts`, following the pattern of existing hooks like `useProjects` and `useProjectDrafts`.
3. THE Dashboard SHALL use shadcn/ui components (Card, Button, Input, Badge, Dialog, Select, Label, Textarea) consistent with the existing UI component usage.
4. THE Dashboard SHALL use the existing toast notification pattern via `useToast` for success and error feedback.
5. THE Dashboard SHALL use the existing Supabase client from `src/integrations/supabase/client.ts` for all database operations.
