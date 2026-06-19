import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
//#region src/routes/index.tsx?tsr-split=component
function Index() {
	const navigate = useNavigate();
	useEffect(() => {
		navigate({
			to: "/home",
			replace: true
		});
	}, [navigate]);
	return null;
}
//#endregion
export { Index as component };
