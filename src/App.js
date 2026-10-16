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
      {props.createdAt && <p className="date-text">작성일: {props.createdAt}</p>}

      {/* [수정: 2026-10-15 16:30] imageUrl이 존재할 때만 원형 이미지 영역 표시 */}
      {props.imageUrl && (
        <div className="image-circle-container">
          <img 
            src={props.imageUrl} 
            alt={props.title} 
            className="circle-image"
          />
          <p className="circle-desc">
            {props.title} 관련 이미지입니다.
          </p>
        </div>
      )}
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
        const imageUrl = event.target.imageUrl.value; 
        props.onCreate(title, body, imageUrl);
      }
    }>
      <p><input type="text" name="title" placeholder="title"/></p>
      <p><textarea name="body" placeholder="body"></textarea></p>
      <p><input type="text" name="imageUrl" placeholder="Image URL (예: /images/cafe1.png)"/></p>
      <p><input type="submit" value="Create"></input></p>
    </form>
  </article>
}

function Update(props){
  const [title, setTitle] = useState(props.title);
  const [body, setBody] = useState(props.body);
  const [imageUrl, setImageUrl] = useState(props.imageUrl || ''); 

 return <article>
    <h2>Update</h2>
    <form onSubmit={
      event=>{
        event.preventDefault();
        props.onUpdate(title, body, imageUrl); 
       }
    }>
      <p><input type="text" name="title" placeholder="title" value={title}
        onChange={event=>setTitle(event.target.value)}/></p>
      <p><textarea name="body" placeholder="body" value={body}
        onChange={event=>setBody(event.target.value)}></textarea></p>
      <p><input type="text" name="imageUrl" placeholder="Image URL" value={imageUrl}
        onChange={event=>setImageUrl(event.target.value)}/></p>
      <p><input type="submit" value="Update"></input></p>
    </form>
  </article>
}

function App() {

  const [mode, setMode] = useState('WELCOME');
  const [id, setId] = useState(null);
  const [topics, setTopics] = useState([]);

  // [수정: 2026-10-15 16:30] 새로고침 시 로그인 풀림 방지: localStorage에서 인증 상태 초기화 복원
  const [isLogin, setIsLogin] = useState(() => {
    return localStorage.getItem('isLogin') === 'true';
  });             
  const [hasAuthPermission, setHasAuthPermission] = useState(() => {
    return localStorage.getItem('hasAuthPermission') === 'true';
  }); 
  const [showSignupModal, setShowSignupModal] = useState(false);      
  const [registeredUser, setRegisteredUser] = useState(() => {
    const savedUser = localStorage.getItem('registeredUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });         

  useEffect(()=>{
    fetch(API_URL)
      .then(res=>{
        if(!res.ok) throw new Error('조회 실패: '+res.status);
        return res.json();
      })
      .then(data=>setTopics(data))
      .catch(err=>{
        console.error(err);
        alert('서버에서 목록을 불러오지 못했어요.');
      });
  }, []);

  async function createTopic(_title, _body, _imageUrl){
    try{
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(API_URL, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({title: _title, body: _body, createdAt: today, imageUrl: _imageUrl})
      });
      if(!res.ok) throw new Error('생성 실패');
      const saved = await res.json();
      setTopics([...topics, saved]);
      setMode('READ');
      setId(saved.id);
    }catch(err){
      console.error(err);
      alert('글을 만들지 못했어요.');
    }
  }

  async function updateTopic(_title, _body, _imageUrl){
    try{
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(API_URL+'/'+id, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({title: _title, body: _body, createdAt: today, imageUrl: _imageUrl})
      });
      if(!res.ok) throw new Error('수정 실패');
      const saved = await res.json();
      const newTopics = topics.map(t => t.id === saved.id ? saved : t);
      setTopics(newTopics);
      setMode('READ');
    }catch(err){
      console.error(err);
      alert('글을 수정하지 못했어요.');
    }
  }

  async function deleteTopic(){
    try{
      const res = await fetch(API_URL+'/'+id, {method:'DELETE'});
      if(!res.ok) throw new Error('삭제 실패');
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
    // [수정: 2026-10-15 16:30] WELCOME 화면에서는 첫 번째 토픽 이미지가 강제로 뜨지 않도록 빈 값 처리
    const defaultImage = ''; 

    content = <Article 
      title='Welcome' 
      body='Hello, WEB' 
      imageUrl={defaultImage}
    ></Article>
  } else if(mode ==='READ'){
    let title, body, imageUrl, createdAt = null;
    for(let i=0; i<topics.length; i++){
       if(topics[i].id === id){
        title = topics[i].title;
        body = topics[i].body;
        imageUrl = topics[i].imageUrl; 
        createdAt = topics[i].createdAt;
      }    
    }

    content = <Article 
      title={title} 
      body={body} 
      createdAt={createdAt} 
      imageUrl={imageUrl} 
    ></Article>
    
    if(isLogin && hasAuthPermission) {
      contextControl = <>
        <input type="button" value="Update" onClick={()=>{ setMode('UPDATE'); }} className="mr-5"/>
        <input type="button" value="Delete" onClick={deleteTopic}/>
      </>;
    }
  } else if(mode === 'CREATE'){
     content = <Create onCreate={createTopic}></Create>
  } else if(mode ==='UPDATE'){
     let title, body, imageUrl = null;
    for(let i=0; i<topics.length; i++){
       if(topics[i].id === id){
        title = topics[i].title;
        body = topics[i].body;
        imageUrl = topics[i].imageUrl; 
      }    
    }
    content = <Update title={title} body={body} imageUrl={imageUrl} onUpdate={updateTopic}></Update> 
  }

  return (
     <div className="app-container">
      
      {/* 상단 우측 영역 (아이디/비번 입력란 및 로그인/회원가입) */}
      <div className="top-bar">
        {isLogin ? (
          <span>
            {registeredUser ? `${registeredUser.name} (${registeredUser.empNo})` : '관리자'}님 환영합니다! 
            <input type="button" value="Logout" onClick={() => { 
              setIsLogin(false); 
              setHasAuthPermission(false);
              setRegisteredUser(null);
              // [수정: 2026-10-15 16:30] 로그아웃 시 localStorage에 저장된 로그인 정보 삭제
              localStorage.removeItem('isLogin');
              localStorage.removeItem('hasAuthPermission');
              localStorage.removeItem('registeredUser');
              setMode('WELCOME'); 
            }} className="ml-10" />
          </span>
        ) : (
          <div>
            <input 
              type="button" 
              value="회원가입" 
              onClick={() => setShowSignupModal(true)} 
              className="mr-5"
            />

            <form onSubmit={async (e) => {
              e.preventDefault();
              const inputId = e.target.loginId.value.trim();
              const inputPw = e.target.loginPw.value.trim();

              if(!inputId || !inputPw) {
                alert('아이디와 비밀번호를 입력해주세요.');
                return;
              }

              if (inputId === 'admin' && inputPw === '898989') {
                setIsLogin(true);
                setHasAuthPermission(true); 
                // [수정: 2026-10-15 16:30] 관리자 로그인 성공 시 localStorage에 인증 정보 저장
                localStorage.setItem('isLogin', 'true');
                localStorage.setItem('hasAuthPermission', 'true');
                alert('관리자 계정으로 로그인되었습니다.');
                return;
              }

              try {
                const res = await fetch(MEMBER_API_URL + '/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ memberId: inputId, password: inputPw })
                });

                if(!res.ok) {
                  alert('아이디 또는 비밀번호가 틀렸습니다.');
                  return;
                }

                const loginUser = await res.json();
                setIsLogin(true);
                setHasAuthPermission(loginUser.hasAuth); 
                setRegisteredUser(loginUser);
                
                // [수정: 2026-10-15 16:30] 일반 회원 로그인 성공 시 localStorage에 인증 정보 저장
                localStorage.setItem('isLogin', 'true');
                localStorage.setItem('hasAuthPermission', loginUser.hasAuth);
                localStorage.setItem('registeredUser', JSON.stringify(loginUser));

                alert(loginUser.name + '님 로그인되었습니다.');

              } catch(err) {
                console.error(err);
                alert('로그인 통신 중 오류가 발생했습니다.');
              }
            }} style={{ display: 'inline' }}>
              <input type="text" name="loginId" placeholder="ID" autoComplete="off" className="login-input" />
              {/* 비밀번호 6자리 제한 수정 - 2026-10-14 11:21 */}
              <input type="password" name="loginPw" placeholder="PW" maxLength={6} className="login-input" />
              <input type="submit" value="Login" />
            </form>
          </div>
        )}
      </div>

      {/* 회원가입 모달 창 */}
      {showSignupModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>회원가입</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const idVal = e.target.modalId.value.trim();
              const pwVal = e.target.modalPw.value.trim();
              const nameVal = e.target.modalName.value.trim();
              const empNoVal = e.target.modalEmpNo.value.trim();
              const authChecked = e.target.modalAuth.checked;

              if(!idVal || !pwVal) {
                alert('아이디와 비밀번호를 입력해주세요.');
                return;
              }

              try {
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

                if(!res.ok) throw new Error('회원가입 실패');

                const savedMember = await res.json();
                setRegisteredUser(savedMember);
                setShowSignupModal(false); 
                alert('회원가입이 완료되었습니다! 로그인해주세요.');

              } catch(err) {
                console.error(err);
                alert('회원가입 중 오류가 발생했습니다.');
              }
            }}>
              <p><input type="text" name="modalId" placeholder="아이디" className="modal-input" autoComplete="off" /></p>
              {/* 회원가입 비밀번호 6자리 제한 수정 - 2026-10-14 11:21 */}
              <p><input type="password" name="modalPw" placeholder="비밀번호" maxLength={6} className="modal-input" /></p>
              <p><input type="text" name="modalName" placeholder="이름" className="modal-input" autoComplete="off" /></p>
              <p><input type="text" name="modalEmpNo" placeholder="사번" className="modal-input" autoComplete="off" /></p>
              <p style={{ fontSize: '0.9em' }}>
                <label>
                  <input type="checkbox" name="modalAuth" /> 메뉴 생성 및 관리 권한 부여
                </label>
              </p>
              <div className="button-group">
                <input type="button" value="취소" onClick={() => setShowSignupModal(false)} className="mr-5" />
                <input type="submit" value="가입 완료" />
              </div>
            </form>
          </div>
        </div>
      )}

      <Header title="WEB" onChangeMode={()=>{ setMode('WELCOME'); setId(null); }}></Header> 
      <Nav topics={topics} onChangeMode={(id)=>{ setMode('READ'); setId(id); }}></Nav>
      {content}   

      <div className="action-buttons-container">
        {isLogin && hasAuthPermission && (mode === 'WELCOME' || mode === 'READ') && (
          <input type="button" value="Create" onClick={()=>{ setMode('CREATE'); }} className="mr-5"/>
        )}
        {contextControl}
      </div>
  </div>
  );
}

export default App;