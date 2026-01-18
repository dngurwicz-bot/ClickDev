import React from 'react';

export const Logo = () => {
    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;700;900&display=swap" rel="stylesheet" />
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Rubik', sans-serif",
                cursor: 'pointer',
                direction: 'ltr',
                gap: '10px',
            }}>
                <div style={{
                    fontSize: '28px',
                    fontWeight: 900,
                    color: '#2C3E50',
                    letterSpacing: '-1px',
                }}>
                    CLICK<span style={{ color: '#00A896' }}>.</span>
                </div>

                <div style={{ width: '1px', height: '20px', backgroundColor: '#BDC3C7' }}></div>

                <div style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#7F8C8D',
                    lineHeight: '1.2',
                }}>
                    DNG<br />HUB
                </div>
            </div>
        </>
    );
};
