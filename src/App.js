import './App.css';
import { useState, useEffect } from 'react';

// Spring Boot API 주소 (firstproject, 8080)
const API_URL = 'http://localhost:8080/api/topics';
const MEMBER_API_URL = 'http://localhost:8080/api/members';

function Header(props){
  console.log('props_Header',props, props.title);
  return <header>
    <h1><a href='/' 
    onClick={
      function(event){
        event.preventDefault();
        props.onChangeMode();
      }
    }
    >{props.title}</a></h1>
  </header>
}

function Nav(props){
  const lis = []
  console.log('props_Nav',props, props.title);
    
  for(let i=0; i<props.topics.length; i++){
      let t = props.topics[i];
      lis.push(<li key={t.id}>
        <a id={t.id} href={'/read/'+t.id} onClick={
          event=>{
          event.preventDefault();
          props.onChangeMode(Number(event.target.id));
        }
        }>{t.title}</a>
      </li>)
  }

  return <nav>
    <ol>
      {lis}
    </ol>
    </nav>
}

function Article(props){
  console.log('props_Article',props, props.title);

  return (<article>
      <h2>{props.title}</h2> 
      <p>{props.body}</p>
      {/* 글 작성/수정 시 전달된 오늘 날짜 표시 */}
      {props.createdAt && <p style={{ color: '#888', fontSize: '0.9em' }}>작성일: {props.createdAt}</p>}
  </article>
  );
}

function Create(props){
  console.log('props_Create',props, props.title);

   return <article>
    <h2>Create</h2>
    <form onSubmit={
      event=>{
        event.preventDefault();
        const title = event.target.title.value;
        const body = event.target.body.value;
        props.onCreate(title, body);
      }
    }>
      <p><input type="text" name="title" placeholder="title"/></p>
      <p><textarea name="body" placeholder="body"></textarea></p>
      <p><input type="submit" value="Create"></input></p>
    </form>
  </article>
}

function Update(props){
  const [title, setTitle] = useState(props.title);
  const [body, setBody] = useState(props.body);

 return <article>
    <h2>Update</h2>
    <form onSubmit={
      event=>{
        event.preventDefault();
        props.onUpdate(title, body);
       }
    }>
      <p><input type="text" name="title" placeholder="title" value={title}
        onChange={event=>setTitle(event.target.value)}/></p>
      <p><textarea name="body" placeholder="body" value={body}
        onChange={event=>setBody(event.target.value)}></textarea></p>
      <p><input type="submit" value="Update"></input></p>
    </form>
  </article>
}

function App() {

  const [mode, setMode] = useState('WELCOME');
  const [id, setId] = useState(null);
  const [topics, setTopics] = useState([]);

  // [권한 및 회원가입 관련 상태 관리]
  const [isLogin, setIsLogin] = useState(false);             // 로그인 여부
  const [hasAuthPermission, setHasAuthPermission] = useState(false); // 메뉴 생성/관리 권한 여부
  const [showSignupModal, setShowSignupModal] = useState(false);      // 회원가입 모달 노출 여부
  const [registeredUser, setRegisteredUser] = useState(null);         // 가입된 회원 정보 저장용

  // 처음 화면 로딩 시 목록 조회 (GET /api/topics)
  useEffect(()=>{
      console.log('useEffect 실행: 목록 조회 시작');
    fetch(API_URL)
      .then(res=>{
        if(!res.ok) throw new Error('조회 실패: '+res.status);
        return res.json();
      })
      .then(data=>{
      console.log('목록 조회 결과', data);
        setTopics(data)})
      .catch(err=>{
        console.error(err);
        alert('서버에서 목록을 불러오지 못했어요. Spring Boot가 실행 중인지 확인하세요.');
      });
  }, []);

  // 생성 (POST /api/topics) - 오늘 날짜 자동 포함
  async function createTopic(_title, _body){
    try{
      const today = new Date().toISOString().slice(0, 10);

      const res = await fetch(API_URL, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({title: _title, body: _body, createdAt: today})
      });
      if(!res.ok) throw new Error('생성 실패: '+res.status);
      const saved = await res.json();
      console.log('목록 create 저장', saved);
      setTopics([...topics, saved]);
      setMode('READ');
      setId(saved.id);
    }catch(err){
      console.error(err);
      alert('글을 만들지 못했어요.');
    }
  }

  // 수정 (PUT /api/topics/{id}) - 오늘 날짜 자동 포함
  async function updateTopic(_title, _body){
    try{
      const today = new Date().toISOString().slice(0, 10);

      const res = await fetch(API_URL+'/'+id, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({title: _title, body: _body, createdAt: today})
      });
      if(!res.ok) throw new Error('수정 실패: '+res.status);
      const saved = await res.json();
      const newTopics = topics.map(t => t.id === saved.id ? saved : t);
      setTopics(newTopics);
      setMode('READ');
    }catch(err){
      console.error(err);
      alert('글을 수정하지 못했어요.');
    }
  }

  // 삭제 (DELETE /api/topics/{id})
  async function deleteTopic(){
    try{
      const res = await fetch(API_URL+'/'+id, {method:'DELETE'});
      if(!res.ok) throw new Error('삭제 실패: '+res.status);
      setTopics(topics.filter(t => t.id !== id));
      setMode('WELCOME'); 
      setId(null);
    }catch(err){
      console.error(err);
      alert('글을 삭제하지 못했어요.');
    }
  }

  let content = null;
  let contextControl = null;

  if(mode === 'WELCOME'){
    content = <Article title='Welcome' body='Hello, WEB'></Article>

  } else if(mode ==='READ'){
     
    let title, body, createdAt = null;
    for(let i=0; i<topics.length; i++){
       if(topics[i].id === id){
        title = topics[i].title;
        body = topics[i].body;
        createdAt = topics[i].createdAt;
      }    
    }
    console.log('현재 read topics 상태:', topics);
    
    content = <Article title={title} body={body} createdAt={createdAt}></Article>
    
    // 로그인 상태이고 메뉴 생성 권한(hasAuthPermission)이 체크된 경우에만 Update, Delete 버튼을 가로로 노출
    if(isLogin && hasAuthPermission) {
      contextControl = <>
        <input type="button" value="Update" onClick={()=>{ setMode('UPDATE'); }} style={{ marginRight: '5px' }}/>
        <input type="button" value="Delete" onClick={deleteTopic}/>
      </>;
    }

  } else if(mode === 'CREATE'){
     content = <Create onCreate={createTopic}></Create>

  } else if(mode ==='UPDATE'){
     let title, body = null;
    for(let i=0; i<topics.length; i++){
       if(topics[i].id === id){
        title = topics[i].title;
        body = topics[i].body;
      }    
    }
    content = <Update title={title} body={body} onUpdate={updateTopic}></Update> 
  }

  return (
     <div style={{ position: 'relative' }}>
      
      {/* [상단 우측 영역] 회원가입 버튼과 로그인 입력창 분리 배치 */}
      <div style={{ textAlign: 'right', padding: '10px', background: '#f1f1f1' }}>
        {isLogin ? (
          <span>
            {registeredUser ? `${registeredUser.name} (${registeredUser.empNo})` : '관리자'}님 환영합니다! 
            <input type="button" value="Logout" onClick={() => { 
              setIsLogin(false); 
              setHasAuthPermission(false);
              setRegisteredUser(null);
              setMode('WELCOME'); 
            }} style={{ marginLeft: '10px' }} />
          </span>
        ) : (
          <div style={{ display: 'inline-block' }}>
            {/* 1. 맨 앞줄에 배치된 회원가입 버튼 */}
            <input 
              type="button" 
              value="회원가입" 
              onClick={() => setShowSignupModal(true)} 
              style={{ marginRight: '15px' }}
            />

            {/* 2. 아이디 및 비밀번호 입력란 */}
            <form onSubmit={(e) => {
              e.preventDefault();
              const inputId = e.target.loginId.value;
              const inputPw = e.target.loginPw.value;

              if((inputId === 'admin' && inputPw === '898989') || (registeredUser && registeredUser.memberId === inputId)) {
                setIsLogin(true);
                setHasAuthPermission(true); 
                alert('로그인되었습니다.');
              } else {
                alert('아이디 또는 비밀번호가 틀렸습니다.');
              }
            }} style={{ display: 'inline' }}>
              <input type="text" name="loginId" placeholder="ID" autoComplete="off" style={{ marginRight: '5px', width: '100px' }} />
              <input type="password" name="loginPw" placeholder="PW" style={{ marginRight: '5px', width: '100px' }} />
              <input type="submit" value="Login" />
            </form>
          </div>
        )}
      </div>

      {/* [회원가입 모달 창 팝업 UI + 스프링 부트 서버 전송 기능 연동] */}
      {showSignupModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '5px', width: '320px', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            <h3>회원가입</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const idVal = e.target.modalId.value;
              const pwVal = e.target.modalPw.value;
              const nameVal = e.target.modalName.value;
              const empNoVal = e.target.modalEmpNo.value;
              const authChecked = e.target.modalAuth.checked;

              if(!idVal || !pwVal) {
                alert('아이디와 비밀번호를 입력해주세요.');
                return;
              }

              try {
                // 스프링 부트 백엔드(`POST /api/members/signup`)로 데이터 전송 및 DB 저장 요청
                const res = await fetch(MEMBER_API_URL + '/signup', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    memberId: idVal,
                    password: pwVal,
                    name: nameVal,
                    empNo: empNoVal,
                    hasAuth: authChecked
                  })
                });

                if(!res.ok) throw new Error('회원가입 서버 전송 실패');

                const savedMember = await res.json();
                console.log('DB 저장 완료된 회원:', savedMember);

                setRegisteredUser(savedMember);
                setShowSignupModal(false); 
                alert('회원가입 및 DB 저장이 완료되었습니다! 로그인해주세요.');

              } catch(err) {
                console.error(err);
                alert('회원가입 중 오류가 발생했습니다. 스프링 부트 서버를 확인해주세요.');
              }
            }}>
              <p><input type="text" name="modalId" placeholder="아이디" style={{ width: '100%' }} autoComplete="off" /></p>
              <p><input type="password" name="modalPw" placeholder="비밀번호" style={{ width: '100%' }} /></p>
              <p><input type="text" name="modalName" placeholder="이름" style={{ width: '100%' }} autoComplete="off" /></p>
              <p><input type="text" name="modalEmpNo" placeholder="사번" style={{ width: '100%' }} autoComplete="off" /></p>
              <p style={{ fontSize: '0.9em' }}>
                <label>
                  <input type="checkbox" name="modalAuth" /> 메뉴 생성 및 관리 권한 부여
                </label>
              </p>
              <div style={{ textAlign: 'right', marginTop: '15px' }}>
                <input type="button" value="취소" onClick={() => setShowSignupModal(false)} style={{ marginRight: '5px' }} />
                <input type="submit" value="가입 완료" />
              </div>
            </form>
          </div>
        </div>
      )}

      <Header title="WEB" onChangeMode={
        ()=>{
            setMode('WELCOME'); 
        }
      }></Header> 

      <Nav topics={topics} onChangeMode={
        (id)=>{
          setMode('READ'); 
          setId(id);
        }        
      }></Nav>

      {content}   

      {/* [수정] Create, Update, Delete 버튼들을 가로로 나열 */}
      <div style={{ marginTop: '10px' }}>
        {isLogin && hasAuthPermission && (mode === 'WELCOME' || mode === 'READ') && (
          <input type="button" value="Create" onClick={()=>{ setMode('CREATE'); }} style={{ marginRight: '5px' }}/>
        )}
        {contextControl}
      </div>
  </div>
  );
}

export default App;