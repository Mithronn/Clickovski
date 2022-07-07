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
                    <style
                        data-emotion-css={this.props.ids.join(" ")}
                        dangerouslySetInnerHTML={{ __html: this.props.css }}
                    />
                    <link rel="icon" href="/favicon.ico" />
                    {this.props.emotionStyleTags}
                </Head>
                <body className="overflow-hidden">
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}