// Public API of the departments feature. Code outside features/departments/
// imports from "@/features/departments", never from a file inside it.
export { AddDepartmentButton } from "./components/actions/add-department-button";
export { DepartmentActions } from "./components/actions/department-actions";
export { DepartmentsView } from "./components/departments-view";
export { ImportInstructionsModal } from "./components/instructions/import-instructions-modal";
export { InstructionEditor } from "./components/instructions/instruction-editor";
export { useDepartmentsPage } from "./hooks/use-departments-page";
