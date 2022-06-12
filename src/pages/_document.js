import Document, { Html, Head, Main, NextScript } from "next/document";
import { extractCritical } from "@emotion/server";
import createEmotionServer from "@emotion/server/create-instance"
import createCache from '@emotion/cache';

function createEmotionCache() {
    return createCache({ key: 'css', prepend: true });
}

export default class MyDocument extends Document {
    static async getInitialProps(ctx) {
        const page = await ctx.renderPage();
        const initialProps = await Document.getInitialProps(ctx);
        const styles = extractCritical(page.html);

        const originalRenderPage = ctx.renderPage;
        const cache = createEmotionCache();
        const { extractCriticalToChunks } = createEmotionServer(cache);

        ctx.renderPage = () =>
            originalRenderPage({
                enhanceApp: (App) =>
                    function EnhanceApp(props) {
                        return <App emotionCache={cache} {...props} />;
                    },
            });

        const emotionStyles = extractCriticalToChunks(initialProps.html);
        const emotionStyleTags = emotionStyles.styles.map((style) => (
            <style
                data-emotion={`${style.key} ${style.ids.join(' ')}`}
                key={style.key}
                dangerouslySetInnerHTML={{ __html: style.css }}
            />
        ));

        return { ...initialProps, ...page, ...styles, emotionStyleTags };
    }

    render() {
        return (
            <Html>
                <Head>
                    <meta name="theme-color" content="#FFFFFF" />
                    <style
                        data-emotion-css={this.props.ids.join(" ")}
                        dangerouslySetInnerHTML={{ __html: this.props.css }}
                    />
                    <link rel="icon" href="/favicon.ico" />
                    {this.props.emotionStyleTags}
                </Head>
                <body className="overflow-hidden">
                    {/* {this.props.__NEXT_DATA__.page === "/update" &&
                        <>
                            <style jsx>{`
                                .titlebar {
                                height: 30px;
                                background: #329ea3;
                                user-select: none;
                                justify-content: flex-end;
                                display: none;
                                position: fixed;
                                top: 0;
                                left: 0;
                                right: 0;
                                }
                                .titlebar-button {
                                display: inline-flex;
                                justify-content: center;
                                align-items: center;
                                width: 30px;
                                height: 30px;
                                }
                                .titlebar-button:hover {
                                background: #5bbec3;
                                }
                                `}
                            </style>

                            <div data-tauri-drag-region className="titlebar">
                                <div className="titlebar-button" id="titlebar-minimize">
                                    <img
                                        src="https://api.iconify.design/mdi:window-minimize.svg"
                                        alt="minimize"
                                    />
                                </div>
                                <div className="titlebar-button" id="titlebar-maximize">
                                    <img
                                        src="https://api.iconify.design/mdi:window-maximize.svg"
                                        alt="maximize"
                                    />
                                </div>
                                <div className="titlebar-button" id="titlebar-close">
                                    <img src="https://api.iconify.design/mdi:close.svg" alt="close" />
                                </div>
                            </div>
                        </>
                    } */}
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}