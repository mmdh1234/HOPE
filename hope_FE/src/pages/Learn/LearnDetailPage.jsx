import React from 'react';
import { useParams } from 'react-router-dom';

const LearnDetailPage = () => {
    // URL의 파라미터 값을 가져옵니다. (예: /learn/1 -> { materialId: '1' })
    const { materialId } = useParams();

    // 실제 앱에서는 이 ID를 사용해 서버에서 데이터를 가져오거나
    // 부모 컴포넌트로부터 받은 전체 목록에서 해당 자료를 찾습니다.

    // ... materialId에 해당하는 자료를 찾는 로직 ...

    return (
        <div>
            <h1>학습 자료 상세 페이지</h1>
            <p>현재 보고 있는 자료 ID: {materialId}</p>

            {/* 여기에 PDF 뷰어나 이미지 뷰어 등을 사용하여 자료 내용을 보여줍니다. */}
        </div>
    );
};

export default LearnDetailPage;