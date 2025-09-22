import React, { useState, useEffect } from 'react';
// 👇 useLocation 훅을 추가로 import 합니다.
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMyCourseProgress } from '../../api/api';
import * as S from './LearnDetailPage.style';
import ConcentrationChecker from '../../components/learn/ConcentrationChecker';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const LearnDetailPage = () => {
    const { materialId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const location = useLocation(); // 👈 location 객체를 가져옵니다.

    const [course, setCourse] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [numPages, setNumPages] = useState(null);

    // 🔥 초기 페이지 번호를 location.state에서 가져오거나, 없으면 1로 설정합니다.
    const [pageNumber, setPageNumber] = useState(location.state?.startPage || 1);

    const [isLoading, setIsLoading] = useState(true);
    const [isCheckerActive, setIsCheckerActive] = useState(false);

    const { mutate: updateProgress } = useMutation({
        mutationFn: (variables) => updateMyCourseProgress(materialId, variables),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myCourses'] });
        },
        onError: (error) => {
            console.error('진도율 업데이트에 실패했습니다:', error);
        },
    });

    // 딜레이 없는 즉시 업데이트 useEffect
    useEffect(() => {
        if (numPages && numPages > 0) {
            updateProgress({ currentPage: pageNumber, totalPages: numPages });
        }
    }, [pageNumber, numPages]);

    // 데이터 로딩 로직 (기존과 동일)
    useEffect(() => {
        // ... (fetchCourseData 로직은 변경 없습니다)
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

    const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
    const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));

    const progress = numPages ? Math.round((pageNumber / numPages) * 100) : 0;

    // ... (JSX 렌더링 부분은 변경 없습니다)
    if (isLoading) {
        return <S.LoadingText>학습 자료를 불러오는 중입니다...</S.LoadingText>;
    }

    return (
        <S.PageWrapper>
            <S.Header>
                <S.HeaderTop>
                    <S.BackButton onClick={() => navigate('/main/learn')}>← 목록으로</S.BackButton>
                    <S.CheckerToggleButton
                        isActive={isCheckerActive}
                        onClick={() => setIsCheckerActive(!isCheckerActive)}
                    >
                        {isCheckerActive ? '집중도 체크 끄기' : '집중도 체크 켜기'}
                    </S.CheckerToggleButton>
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
                            <Page pageNumber={pageNumber} />
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

            {isCheckerActive && <ConcentrationChecker />}
        </S.PageWrapper>
    );
};

export default LearnDetailPage;