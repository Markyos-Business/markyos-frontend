// Public API of the departments feature. Code outside features/departments/
// imports from "@/features/departments", never from a file inside it.
export { AddDepartmentButton } from "./components/AddDepartmentButton";
export { DepartmentActions } from "./components/DepartmentActions";
export { DepartmentsView } from "./components/DepartmentsView";
export { ImportInstructionsModal } from "./components/ImportInstructionsModal";
export { InstructionEditor } from "./components/InstructionEditor";
export { useDepartmentsPage } from "./hooks/useDepartmentsPage";
