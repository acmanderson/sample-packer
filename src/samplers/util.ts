import { FileRejection } from "react-dropzone";

export const formatFileRejections = (fileRejections: FileRejection[]): string =>
  `${fileRejections
    .map(
      (rejection) =>
        `${rejection.file.name} (${rejection.errors
          .map((error) => error.message)
          .join(", ")})`
    )
    .join(", ")}`;
