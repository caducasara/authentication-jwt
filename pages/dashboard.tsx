import Router from "next/router"
import { destroyCookie } from "nookies"
import { useContext, useEffect } from "react"
import { Can } from "../components/Can"
import { AuthContext } from "../contexts/AuthContext"
import { setupAPIClient } from "../services/api"
import { api } from "../services/apiClient"
import { withSSRAuth } from "../utils/withSSRAuth"

export default function Dashboard() {

  useEffect(()=>{
    api.get('me')
    .then(response => console.log("teste:", response))
    .catch( err => console.log(err))
  })

  const { user, signOut } = useContext(AuthContext)

  return (
    <>
    <button onClick={signOut}>Sign Out</button>
    <h1>Dashboard: {user?.email}</h1>
    <Can permissions={['metrics.list']}>
      <div>
        Métricas:
      </div>
    </Can>
    </>
  )
}

export const getServerSideProps = withSSRAuth( async (context) => {

  const apiClient = setupAPIClient(context)
  const response = await apiClient.get('/me')
  console.log(response.data)

  return {
    props: {}
  }
})
