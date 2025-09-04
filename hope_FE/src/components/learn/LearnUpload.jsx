import React, { useState, useCallback, useRef } from 'react';
import * as S from './LearnUpload.style'; // 스타일 파일을 S 객체로 가져옵니다.

const LearnUpload = ({ onAddMaterial }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('컴퓨터 기초');
    const [selectedFile, setSelectedFile] = useState(null); // 파일 상태 관리
    const fileInputRef = useRef(null); // 파일 input에 접근하기 위한 ref

    // 파일 드롭 핸들러
    const onDrop = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        }
    }, []);

    // 드래그 오버 핸들러 (이벤트 기본 동작 방지)
    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
    }, []);

    // '파일 선택' 버튼 클릭 핸들러
    const onFileSelectClick = () => {
        fileInputRef.current.click();
    };

    // 파일 input 변경 핸들러
    const onFileChange = (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        }
    };

    // 폼 제출 핸들러
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !description || !selectedFile) {
            return alert('제목, 설명, 파일을 모두 선택해주세요.');
        }

        const newMaterial = {
            title,
            description,
            category,
            progress: 0,
            // 실제 파일 정보에서 파일명, 타입, 크기를 추출합니다.
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            size: (selectedFile.size / (1024 * 1024)).toFixed(2) + 'MB',
            file: selectedFile, // 실제 파일 객체
        };

        onAddMaterial(newMaterial);

        // 제출 후 폼 초기화
        setTitle('');
        setDescription('');
        setCategory('컴퓨터 기초');
        setSelectedFile(null);
    };

    return (
        <S.FormWrapper onSubmit={handleSubmit}>
            <S.UploadArea onDrop={onDrop} onDragOver={onDragOver}>
                <S.UploadIcon>⬆️</S.UploadIcon>
                <S.UploadText>파일을 드래그하거나 클릭하여 업로드</S.UploadText>
                <S.SupportedFilesText>PPT, PDF, 이미지 파일을 지원합니다.</S.SupportedFilesText>

                {/* 숨겨진 실제 파일 input */}
                <S.FileInput
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    accept=".ppt, .pptx, .pdf, image/*"
                />

                {/* '파일 선택' 버튼 */}
                <S.FileSelectButton type="button" onClick={onFileSelectClick}>
                    파일 선택
                </S.FileSelectButton>

                {/* 선택된 파일 이름 표시 */}
                {selectedFile && (
                    <S.SelectedFileText>
                        선택된 파일: {selectedFile.name}
                    </S.SelectedFileText>
                )}
            </S.UploadArea>

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