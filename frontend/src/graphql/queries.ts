import { gql } from 'urql';

// Chat Query
export const CHAT_QUERY = gql`
  query Chat($message: String!) {
    chat(message: $message) {
      reply
    }
  }
`;

// Upload PDF Mutation
export const UPLOAD_PDF_MUTATION = gql`
  mutation UploadPDF($file: Upload!) {
    uploadPDF(file: $file) {
      success
      message
    }
  }
`;
