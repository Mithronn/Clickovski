import React from 'react'
import {Turkey,British} from "../components/icons";

function Flags(props: any) {
    const {language, className, width, height, style} = props;

    if(language === "Türkçe") {
        return <Turkey className={className} width={width || 24} height={height ||24} style={style}/>
    } else if(language === "English") {
        return <British className={className} width={width || 24} height={height ||24} style={style}/>
    } else {
        return <British className={className} width={width || 24} height={height ||24} style={style}/>
    }
}

export default Flags