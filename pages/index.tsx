import type { GetServerSideProps, NextPage } from 'next'
import { FormEvent, useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import styles from '../styles/Home.module.css'
import { withSSRGuest } from '../utils/withSSRGuest';

const Home: NextPage = () => {

  const {signIn} = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword]= useState('');

  async function handleSubmit(event: FormEvent){
    event.preventDefault();

    const data = {
      email,
      password
    }

    await signIn(data)
  }

  return (
   <div className={styles.main}>
     <form onSubmit={handleSubmit} className={styles.form} action="">
       <input type="email" value={email} onChange={(event) => setEmail(event.target.value)}/>
       <input type="password" value={password} onChange={(event) => setPassword(event.target.value)}/>
       <button type="submit">Entrar</button>
     </form>
   </div>
  )
}

export default Home


export const getServerSideProps = withSSRGuest<{ users: string[] }>(async (context) => {
  
  return {
    props:{}
  }
})