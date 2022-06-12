import React from 'react'
import { useSelector, useDispatch } from "react-redux";
import { setDarkMode } from "../redux/actions";
import localforage from 'localforage';

function useTheme(reduxState = null) {
    const redux = useSelector((state) => state);
    const dispatch = useDispatch();
    const [isDarkM, setDarkM] = React.useState(redux && redux.isDarkMode ? redux.isDarkMode : false);

    React.useEffect(() => {
        localforage.getItem("settings", (err, data) => {
            if (data) {
                let mode = JSON.parse(data)?.isDarkMode
                dispatch(setDarkMode(mode));
                return setDarkM(mode);
            }

            if (err) {
                dispatch(setDarkMode(false));
                return setDarkM(false);
            }
        })
    }, []);

    return (reduxState && typeof (reduxState.isDarkMode) != 'undefined' && reduxState.isDarkMode != null) ?
        redux.isDarkMode
        :
        isDarkM
}

export default useTheme