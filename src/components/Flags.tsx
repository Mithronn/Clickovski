import React from 'react'
import { Turkey, British, Russia, Spain, France, Germany, Porteguese, Arabic } from "../components/icons";

function Flags(props: any) {
    const { language, className, width, height, style } = props;

    switch (language) {
        case "Türkçe": return <Turkey className={className} width={width || 24} height={height || 24} style={style} />
        case "Русский": return <Russia className={className} width={width || 24} height={height || 24} style={style} />
        case "Español": return <Spain className={className} width={width || 24} height={height || 24} style={style} />
        case "Português": return <Porteguese className={className} width={width || 24} height={height || 24} style={style} />
        case "Français": return <France className={className} width={width || 24} height={height || 24} style={style} />
        case "Deutsch": return <Germany className={className} width={width || 24} height={height || 24} style={style} />
        case "عربي": return <Arabic className={className} width={width || 24} height={height || 24} style={style} />
        case "English":
        default:
            return <British className={className} width={width || 24} height={height || 24} style={style} />
    }
}

export default Flags