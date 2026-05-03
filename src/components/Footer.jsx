import React from 'react';
import { Utensils, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

function Footer() {
    return (
        <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', transition: 'background 0.25s ease' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>

                    {/* Về Chúng Tôi */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <Utensils size={28} color="#d4a853" />
                            <div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>FOOD & DRINK</div>
                                <div style={{ fontSize: 11, letterSpacing: '0.15em', color: 'var(--text-muted)' }}>FOOD & BEVERAGE</div>
                            </div>
                        </div>
                        <p style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 16, color: 'var(--text-secondary)' }}>
                            Nơi hội tụ những món ăn ngon và đồ uống hấp dẫn. Chúng tôi mang đến trải nghiệm ẩm thực tuyệt vời.
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            {[
                                { href: 'https://facebook.com', Icon: Facebook },
                                { href: 'https://instagram.com', Icon: Instagram },
                                { href: 'https://twitter.com', Icon: Twitter },
                                { href: 'https://youtube.com', Icon: Youtube },
                            ].map(({ href, Icon }) => (
                                <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'all 0.2s', textDecoration: 'none' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#d4a853'; e.currentTarget.style.color = '#0a0a0a'; e.currentTarget.style.borderColor = '#d4a853' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)' }}
                                ><Icon size={16} /></a>
                            ))}
                        </div>
                    </div>

                    {/* Liên Kết Nhanh */}
                    <div>
                        <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 16, marginBottom: 16, marginTop: 0 }}>Liên Kết Nhanh</h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {['Trang Chủ', 'Thực Đơn', 'Giới Thiệu', 'Tin Tức', 'Liên Hệ', 'Tuyển Dụng'].map(l => (
                                <li key={l}><a href="#" style={{ color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#d4a853'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                                >{l}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Chính Sách */}
                    <div>
                        <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 16, marginBottom: 16, marginTop: 0 }}>Chính Sách</h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {['Chính Sách Bảo Mật', 'Điều Khoản Sử Dụng', 'Chính Sách Đổi Trả', 'Phương Thức Thanh Toán', 'Vận Chuyển & Giao Hàng'].map(l => (
                                <li key={l}><a href="#" style={{ color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#d4a853'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                                >{l}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Liên Hệ */}
                    <div>
                        <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 16, marginBottom: 16, marginTop: 0 }}>Liên Hệ</h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                <MapPin size={16} color="#d4a853" style={{ flexShrink: 0, marginTop: 2 }} />
                                <span style={{ fontSize: 13 }}>2/60, Thủ Đức, TP.HCM</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Phone size={16} color="#d4a853" style={{ flexShrink: 0 }} />
                                <a href="tel:0328778198" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>0328778198</a>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Mail size={16} color="#d4a853" style={{ flexShrink: 0 }} />
                                <a href="mailto:contact@fooddrink.vn" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>contact@fooddrink.vn</a>
                            </li>
                        </ul>
                        <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                            <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 6px', fontSize: 13 }}>Giờ Mở Cửa</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '0 0 4px' }}>Thứ 2 - Chủ Nhật</p>
                            <p style={{ color: '#d4a853', fontWeight: 700, margin: 0 }}>7:00 - 23:00</p>
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 40, paddingTop: 24, textAlign: 'center', fontSize: 13 }}>
                    <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)' }}>&copy; 2024 Food & Drink. Tất cả quyền được bảo lưu.</p>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 12 }}>Thiết kế bởi Food & Drink Team</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;