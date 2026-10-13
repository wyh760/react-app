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

  const [isLogin, setIsLogin] = useState(false);             
  const [hasAuthPermission, setHasAuthPermission] = useState(false); 
  const [showSignupModal, setShowSignupModal] = useState(false);      
  const [registeredUser, setRegisteredUser] = useState(null);         

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

  async function createTopic(_title, _body){
    try{
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(API_URL, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({title: _title, body: _body, createdAt: today})
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

  async function updateTopic(_title, _body){
    try{
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(API_URL+'/'+id, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({title: _title, body: _body, createdAt: today})
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
    content = <Article title={title} body={body} createdAt={createdAt}></Article>
    
    if(isLogin && hasAuthPermission) {
      contextControl = <>
        <input type="button" value="Update" onClick={()=>{ setMode('UPDATE'); }} className="mr-5"/>
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
     <div className="app-container">
      
      {/* 상단 우측 영역 */}
      <div className="top-bar">
        {isLogin ? (
          <span>
            {registeredUser ? `${registeredUser.name} (${registeredUser.empNo})` : '관리자'}님 환영합니다! 
            <input type="button" value="Logout" onClick={() => { 
              setIsLogin(false); 
              setHasAuthPermission(false);
              setRegisteredUser(null);
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
                alert(loginUser.name + '님 로그인되었습니다.');

              } catch(err) {
                console.error(err);
                alert('로그인 통신 중 오류가 발생했습니다.');
              }
            }} style={{ display: 'inline' }}>
              <input type="text" name="loginId" placeholder="ID" autoComplete="off" className="login-input" />
              <input type="password" name="loginPw" placeholder="PW" className="login-input" />
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
              <p><input type="password" name="modalPw" placeholder="비밀번호" className="modal-input" /></p>
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

      <Header title="WEB" onChangeMode={()=>{ setMode('WELCOME'); }}></Header> 
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