import { useContext } from "react"
import { AuthContext } from "../contexts/AuthContext"
import { validateUserPermission } from "../utils/ValidateUserPermissions";

type UseCanParams = {
  permissions?: string[];
  roles?: string[];
}

export function useCan( {permissions = [], roles = []}: UseCanParams){

  const {user, isAuthenticated} = useContext(AuthContext)

  if(!isAuthenticated){
    return false;
  }

  const userHasValidatePermissions = validateUserPermission({
    user,
    permissions,
    roles
  })

  return userHasValidatePermissions;
}