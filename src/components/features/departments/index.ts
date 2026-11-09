// Public API of the departments feature. Code outside features/departments/
// imports from "@/features/departments", never from a file inside it.
export { AddDepartmentButton } from "./components/actions/AddDepartmentButton";
export { DepartmentActions } from "./components/actions/DepartmentActions";
export { DepartmentsView } from "./components/DepartmentsView";
export { ImportInstructionsModal } from "./components/instructions/ImportInstructionsModal";
export { InstructionEditor } from "./components/instructions/InstructionEditor";
export { useDepartmentsPage } from "./hooks/useDepartmentsPage";
