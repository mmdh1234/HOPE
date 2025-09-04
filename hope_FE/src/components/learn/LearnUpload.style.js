import styled from 'styled-components';

export const FormWrapper = styled.form`
  background-color: white;
  padding: 2rem;
  border-radius: 16px;
  max-width: 800px;
  margin: 0 auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
`;

// --- 파일 업로드 영역 ---
export const UploadArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  margin-bottom: 2rem;
  border: 2px dashed #ced4da;
  border-radius: 12px;
  background-color: #f8f9fa;
  text-align: center;
  transition: border-color 0.2s;

  &:hover {
    border-color: #0059ff;
  }
`;

export const UploadIcon = styled.div`
  font-size: 48px;
  color: #868e96;
  margin-bottom: 1rem;
`;

export const UploadText = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  margin: 0 0 0.5rem 0;
`;

export const SupportedFilesText = styled.p`
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0 0 1.5rem 0;
`;

export const FileSelectButton = styled.button`
  padding: 10px 20px;
  background-color: #343a40;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;

  &:hover {
    background-color: #495057;
  }
`;

export const FileInput = styled.input`
  display: none;
`;

export const SelectedFileText = styled.p`
    margin-top: 1rem;
    font-size: 0.9rem;
    color: #28a745;
    font-weight: 600;
`;


// --- 나머지 폼 요소 ---
export const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

export const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 1rem;
`;

export const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-sizing: border-box;
`;

export const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
`;

export const Textarea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  min-height: 120px;
  resize: vertical;
  box-sizing: border-box;
`;

export const SubmitButton = styled.button`
  width: 100%;
  padding: 14px;
  border: none;
  background-color: #28a745;
  color: white;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background-color: #218838;
  }
`;