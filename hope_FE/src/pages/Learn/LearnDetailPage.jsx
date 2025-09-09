import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import * as S from './LearnDetailPage.style';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const LearnDetailPage = () => {
    const { materialId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    
    // 스크롤 위치를 기억하기 위한 ref
    const scrollPositionRef = useRef(0);

    // 데이터 로딩 useEffect
    useEffect(() => {
        const fetchCourseData = async () => {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            try {
                const courseRes = await fetch(`/api/courses/${materialId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!courseRes.ok) throw new Error('강좌 정보를 가져올 수 없습니다.');
                const courseData = await courseRes.json();
                setCourse(courseData);

                const pdfRes = await fetch(`/api/courses/${materialId}/pdf`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!pdfRes.ok) throw new Error('PDF 파일을 가져올 수 없습니다.');
                const pdfBlob = await pdfRes.blob();
                setPdfUrl(URL.createObjectURL(pdfBlob));

            } catch (error) {
                console.error("Failed to load course:", error);
                alert(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourseData();

        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [materialId]);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    // 페이지 이동 함수
    const goToPrevPage = () => {
        scrollPositionRef.current = window.scrollY; // 현재 스크롤 위치 저장
        setPageNumber(prev => Math.max(prev - 1, 1));
    };

    const goToNextPage = () => {
        scrollPositionRef.current = window.scrollY; // 현재 스크롤 위치 저장
        setPageNumber(prev => Math.min(prev + 1, numPages));
    };

    // --- 여기가 핵심 수정 부분입니다 ---
    // PDF 렌더링이 성공적으로 완료된 후 스크롤 위치를 복원합니다.
    const onPageRenderSuccess = () => {
        window.scrollTo(0, scrollPositionRef.current);
    };

    const progress = numPages ? Math.round((pageNumber / numPages) * 100) : 0;

    if (isLoading) {
        return <S.LoadingText>학습 자료를 불러오는 중입니다...</S.LoadingText>;
    }

    return (
        <S.PageWrapper>
            <S.Header>
                <S.HeaderTop>
                    <S.BackButton onClick={() => navigate('/main/learn')}>← 목록으로</S.BackButton>
                </S.HeaderTop>
                <S.Title>{course?.title}</S.Title>
                <S.Description>{course?.description}</S.Description>
                <S.MetaInfo>
                    <span>📄 {numPages || 0}페이지</span>
                </S.MetaInfo>
            </S.Header>

            <S.PdfViewerContainer>
                <S.PaginationControls>
                    <S.NavButton onClick={goToPrevPage} disabled={pageNumber <= 1}>이전</S.NavButton>
                    <S.PageNumber>{pageNumber} / {numPages}</S.PageNumber>
                    <S.NavButton onClick={goToNextPage} disabled={pageNumber >= numPages}>다음</S.NavButton>
                </S.PaginationControls>

                <S.PdfDocumentWrapper>
                    {pdfUrl && (
                        <Document
                            file={pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={<S.LoadingText>PDF 렌더링 중...</S.LoadingText>}
                        >
                            <Page
                                pageNumber={pageNumber}
                                onRenderSuccess={onPageRenderSuccess} // 렌더링 성공 시 콜백 함수 연결
                            />
                        </Document>
                    )}
                </S.PdfDocumentWrapper>
            </S.PdfViewerContainer>

            <S.Footer>
                <S.ProgressBarContainer>
                    <S.ProgressBarFill progress={progress} />
                </S.ProgressBarContainer>
                <S.ProgressInfo>
                    <span>학습 진도</span>
                    <span>{progress}% 완료</span>
                </S.ProgressInfo>
            </S.Footer>
        </S.PageWrapper>
    );
};

export default LearnDetailPage;