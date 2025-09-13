import React, { useState, useCallback, useRef } from 'react';
import * as S from './LearnUpload.style';

// onUploadSuccess prop을 추가로 받습니다.
const LearnUpload = ({ onUploadSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('컴퓨터 기초');
    const [difficulty, setDifficulty] = useState('beginner'); // 난이도 상태 추가
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    // ... (onDrop, onDragOver, onFileSelectClick, onFileChange 함수는 기존과 동일)
    const onDrop = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        }
    }, []);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
    }, []);

    const onFileSelectClick = () => {
        fileInputRef.current.click();
    };

    const onFileChange = (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        }
    };

    // 폼 제출 핸들러 (API 연동 로직으로 수정)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !description || !selectedFile) {
            return alert('제목, 설명, 파일을 모두 선택해주세요.');
        }

        const formData = new FormData();
        const userId = localStorage.getItem('userId');
        if (!userId) {
            return alert('사용자 ID를 찾을 수 없습니다. 로그인이 필요합니다.');
        }
        formData.append('userId', userId);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('difficulty', difficulty);
        formData.append('pdf', selectedFile); // 백엔드에서 'pdf'라는 키로 받음

        const token = localStorage.getItem('token');

        try {
            const res = await fetch('/api/courses', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData, // FormData를 body에 담아 전송
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || '업로드에 실패했습니다.');
            }

            alert('자료가 성공적으로 업로드되었습니다!');
            
            // 폼 초기화
            setTitle('');
            setDescription('');
            setCategory('컴퓨터 기초');
            setDifficulty('beginner');
            setSelectedFile(null);

            // 업로드 성공 시 부모 컴포넌트의 콜백 함수 호출
            if (onUploadSuccess) {
                onUploadSuccess();
            }

        } catch (error) {
            console.error('Upload error:', error);
            alert(`업로드 중 오류가 발생했습니다: ${error.message}`);
        }
    };

    return (
        <S.FormWrapper onSubmit={handleSubmit}>
            {/* ... (UploadArea JSX는 기존과 동일) ... */}
            <S.UploadArea onDrop={onDrop} onDragOver={onDragOver}>
                <S.UploadIcon>⬆️</S.UploadIcon>
                <S.UploadText>파일을 드래그하거나 클릭하여 업로드</S.UploadText>
                <S.SupportedFilesText>PDF 파일을 지원합니다.</S.SupportedFilesText>
                <S.FileInput
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    accept=".pdf"
                />
                <S.FileSelectButton type="button" onClick={onFileSelectClick}>
                    파일 선택
                </S.FileSelectButton>
                {selectedFile && (
                    <S.SelectedFileText>
                        선택된 파일: {selectedFile.name}
                    </S.SelectedFileText>
                )}
            </S.UploadArea>

            {/* ... (제목, 카테고리, 설명 FormGroup은 기존과 유사) ... */}
            <S.FormGroup>
                <S.Label>제목</S.Label>
                <S.Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="학습 자료 제목을 입력하세요" />
            </S.FormGroup>
            
            <S.FormGroup>
                <S.Label>카테고리</S.Label>
                <S.Select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="컴퓨터 기초">컴퓨터 기초</option>
                    <option value="인터넷">인터넷</option>
                    <option value="코딩">코딩</option>
                    <option value="알고리즘">알고리즘</option>
                    <option value="SW 활용">SW 활용</option>
                    <option value="웹 개발">웹 개발</option>
                </S.Select>
            </S.FormGroup>

            {/* 난이도 선택 필드 추가 */}
            <S.FormGroup>
                <S.Label>난이도</S.Label>
                <S.Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="beginner">초급</option>
                    <option value="intermediate">중급</option>
                    <option value="advanced">고급</option>
                </S.Select>
            </S.FormGroup>

            <S.FormGroup>
                <S.Label>설명</S.Label>
                <S.Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="학습 자료에 대한 설명을 입력하세요"></S.Textarea>
            </S.FormGroup>


            <S.SubmitButton type="submit">업로드</S.SubmitButton>
        </S.FormWrapper>
    );
};

export default LearnUpload;