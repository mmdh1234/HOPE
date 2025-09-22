import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCourses, getMyCourseProgress } from '../../api/api';
import {
    ProgressContainer,
    Title,
    SummaryBox,
    SummaryTitle,
    SummaryProgress,
    CourseList,
    CourseCard,
    CourseTitle,
    ProgressBarContainer,
    ProgressBar,
    ContinueButton,
    LoadingText,
    NoCoursesText,
} from './progress.style';

const ProgressPage = () => {
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCoursesAndProgress = async () => {
            try {
                const response = await getMyCourses();
                const myCoursesArray = response.data.items;

                if (!Array.isArray(myCoursesArray)) {
                    console.error("Course data is not an array:", myCoursesArray);
                    setCourses([]);
                    return; 
                }

                const coursesWithProgress = await Promise.all(
                    myCoursesArray.map(async (course) => {
                        try {
                            // 이제 이 함수는 알아서 userId를 포함해 요청을 보냅니다.
                            const progressRes = await getMyCourseProgress(course._id);
                            return { ...course, progressData: progressRes.data };
                        } catch (error) {
                             // 진도 정보가 없는 강좌는 0%로 처리합니다.
                            console.error(`Error fetching progress for course ${course._id}:`, error);
                            return { ...course, progressData: { currentPage: 0, totalPages: 0 } };
                        }
                    })
                );

                setCourses(coursesWithProgress);
            } catch (error) {
                console.error("Failed to fetch courses and progress:", error);
                alert('강좌 정보를 불러오는 중 오류가 발생했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCoursesAndProgress();
    }, []);

    const totalCurrentPages = courses.reduce((acc, course) => acc + course.progressData.currentPage, 0);
    const totalAllPages = courses.reduce((acc, course) => acc + course.progressData.totalPages, 0);
    
    const overallProgressPercentage = totalAllPages > 0
        ? (totalCurrentPages / totalAllPages) * 100
        : 0;

    const calculateCoursePercentage = (progressData) => {
        if (!progressData || progressData.totalPages === 0) {
            return 0;
        }
        return (progressData.currentPage / progressData.totalPages) * 100;
    };

    if (isLoading) {
        return <LoadingText>진도 현황을 불러오는 중입니다...</LoadingText>;
    }
    
    return (
        <ProgressContainer>
            <Title>나의 학습 현황</Title>
            
            <SummaryBox>
                <SummaryTitle>전체 학습 진도율</SummaryTitle>
                <ProgressBarContainer>
                    <ProgressBar $progress={overallProgressPercentage} />
                </ProgressBarContainer>
                <SummaryProgress>{overallProgressPercentage.toFixed(1)}%</SummaryProgress>
            </SummaryBox>

            <CourseList>
                {courses.length > 0 ? (
                    courses.map((course) => {
                        const coursePercentage = calculateCoursePercentage(course.progressData);
                        return (
                            <CourseCard key={course._id}>
                                <div>
                                    <CourseTitle>{course.title}</CourseTitle>
                                    <ProgressBarContainer>
                                        <ProgressBar $progress={coursePercentage} />
                                    </ProgressBarContainer>
                                    <span>{coursePercentage.toFixed(1)}%</span>
                                </div>
                                <ContinueButton onClick={() => navigate(`/main/learn/${course._id}`)}>
                                    학습 이어하기
                                </ContinueButton>
                            </CourseCard>
                        )
                    })
                ) : (
                    <NoCoursesText>아직 수강 중인 강좌가 없습니다. '학습하기' 탭에서 새로운 학습을 시작해 보세요!</NoCoursesText>
                )}
            </CourseList>
        </ProgressContainer>
    );
};

export default ProgressPage;