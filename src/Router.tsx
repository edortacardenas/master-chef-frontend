import { Route, Routes } from "react-router-dom"
import { routes } from "./router-config"

export const AppRouter = () => {
  return (
    <div>
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
    </div>
  )
}