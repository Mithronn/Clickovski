import React from 'react';

function useOS() {
    const [isPlatform] = React.useState(typeof window !== 'undefined' ? window : false);

    return isPlatform;
}

export default useOS;