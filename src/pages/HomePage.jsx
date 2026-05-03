import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Utensils, Award, Truck, Coffee, Pizza, IceCream,
    Clock, Phone, MapPin, Star, ChevronRight,
    Users, ThumbsUp, Heart, ShoppingBag, Calendar,
    ChefHat, Sparkles, Gift, CreditCard, Wifi, Music
} from 'lucide-react';
import Footer from '../components/Footer';

function HomePage() {
    const navigate = useNavigate();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [hoveredDish, setHoveredDish] = useState(null);

    // Hero images
    const heroImages = [
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1920&h=1080&fit=crop'
    ];

    // Featured dishes
    const featuredDishes = [
        { id: 1, name: 'Bò Né', price: 89000, image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop', category: 'food', rating: 4.8, orders: 234 },
        { id: 2, name: 'Cà Phê Sữa Đá', price: 35000, image: 'https://images.unsplash.com/photo-1525806008995-dda6cc5b1cff?w=400&h=300&fit=crop', category: 'drink', rating: 4.9, orders: 567 },
        { id: 3, name: 'Pizza Hải Sản', price: 189000, image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop', category: 'food', rating: 4.7, orders: 189 },
        { id: 4, name: 'Trà Sữa Trân Châu', price: 45000, image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=400&h=300&fit=crop', category: 'drink', rating: 4.8, orders: 432 },
        { id: 5, name: 'Mì Ý Sốt Bò Băm', price: 99000, image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop', category: 'food', rating: 4.6, orders: 156 },
        { id: 6, name: 'Sinh Tố Bơ', price: 39000, image: 'https://images.unsplash.com/photo-1526424382096-74a71e0e13a3?w=400&h=300&fit=crop', category: 'drink', rating: 4.7, orders: 278 },
    ];

    // Categories
    const categories = [
        { id: 'all', name: 'Tất Cả', icon: '🍽️' },
        { id: 'food', name: 'Món Ăn', icon: '🍕' },
        { id: 'drink', name: 'Thức Uống', icon: '🥤' },
    ];

    const filteredDishes = selectedCategory === 'all'
        ? featuredDishes
        : featuredDishes.filter(dish => dish.category === selectedCategory);

    // Stats
    const stats = [
        { icon: <Users />, value: '10K+', label: 'Khách Hàng', color: '#FF6B35' },
        { icon: <ThumbsUp />, value: '98%', label: 'Hài Lòng', color: '#F7931E' },
        { icon: <Coffee />, value: '50+', label: 'Món Ngon', color: '#FFB347' },
        { icon: <Heart />, value: '5+', label: 'Năm Kinh Nghiệm', color: '#FF6B35' },
    ];

    // Opening hours
    const openingHours = [
        { day: 'Thứ 2 - Thứ 6', hours: '08:00 - 22:00' },
        { day: 'Thứ 7 - Chủ Nhật', hours: '09:00 - 23:00' },
    ];

    // Testimonials
    const testimonials = [
        { id: 1, name: 'Nguyễn Thị Hương', avatar: 'https://randomuser.me/api/portraits/women/1.jpg', rating: 5, comment: 'Không gian đẹp, đồ ăn ngon, phục vụ chuyên nghiệp. Sẽ quay lại!', dish: 'Bò Né' },
        { id: 2, name: 'Trần Văn An', avatar: 'https://randomuser.me/api/portraits/men/2.jpg', rating: 5, comment: 'Cà phê ngon xuất sắc, view đẹp, nhân viên thân thiện.', dish: 'Cà Phê Sữa Đá' },
        { id: 3, name: 'Lê Thị Mai', avatar: 'https://randomuser.me/api/portraits/women/3.jpg', rating: 4, comment: 'Pizza ngon, giá cả hợp lý. Sẽ giới thiệu bạn bè.', dish: 'Pizza Hải Sản' },
    ];

    // Special offers
    const offers = [
        { id: 1, title: 'Giảm 20%', description: 'Cho đơn hàng đầu tiên', code: 'FIRST20', icon: <Gift /> },
        { id: 2, title: 'Miễn Phí Giao Hàng', description: 'Cho đơn từ 200K', code: 'SHIPFREE', icon: <Truck /> },
        { id: 3, title: 'Combo Tiết Kiệm', description: 'Mua 2 tặng 1', code: 'BUY2GET1', icon: <ShoppingBag /> },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
        }, 3500);
        return () => clearInterval(interval);
    }, [heroImages.length]);

    return (
        <div className="min-h-screen" style={{ background: '#FAFAFA' }}>
            {/* Hero Section */}
            <div className="relative h-screen flex items-center justify-center text-white overflow-hidden">
                {heroImages.map((image, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                        style={{
                            backgroundImage: `url(${image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    />
                ))}
                <div className="absolute inset-0 bg-black/60 z-[1]"></div>

                <div className="relative text-center z-10 px-4 max-w-4xl mx-auto">
                    <div className="animate-fade-in-up">
                        <span className="inline-block px-4 py-2 bg-amber-500/20 backdrop-blur-sm rounded-full text-amber-300 text-sm mb-6">
                            🎉 Chào Mừng Đến Với FoodHub
                        </span>
                        <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                            Tinh Hoa Ẩm Thực
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-gray-200">
                            Trải nghiệm hương vị tuyệt vời từ những đầu bếp hàng đầu
                        </p>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <button
                                onClick={() => navigate('/menu')}
                                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-4 text-lg font-semibold rounded-full transition-all transform hover:scale-105 shadow-lg"
                            >
                                Xem Thực Đơn
                            </button>
                            <button
                                onClick={() => navigate('/shop')}
                                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 py-4 text-lg font-semibold rounded-full transition-all border border-white/30"
                            >
                                Đặt Bàn Ngay
                            </button>
                        </div>
                    </div>
                </div>

                {/* Indicators */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
                    {heroImages.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`h-1.5 rounded-full transition-all ${currentImageIndex === index
                                ? 'bg-amber-500 w-10'
                                : 'bg-white/50 hover:bg-white/80 w-3'
                                }`}
                        />
                    ))}
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
                        <div className="w-1 h-2 bg-white/50 rounded-full mt-2 animate-scroll"></div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="py-16 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center transform hover:scale-105 transition-all duration-300">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-4" style={{ color: stat.color }}>
                                    {stat.icon}
                                </div>
                                <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
                                <div className="text-gray-600 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Featured Dishes Section */}
            <div className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <span className="text-amber-600 font-semibold uppercase tracking-wide">Món Ngon Đặc Sắc</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mt-2 mb-4">Thực Đơn Nổi Bật</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">Những món ăn được yêu thích nhất từ thực khách</p>
                    </div>

                    {/* Category Filter */}
                    <div className="flex justify-center gap-4 mb-12">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-6 py-2 rounded-full font-semibold transition-all flex items-center gap-2 ${selectedCategory === cat.id
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                <span className="text-lg">{cat.icon}</span>
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Dishes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredDishes.map((dish, index) => (
                            <div
                                key={dish.id}
                                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translateY-2"
                                onMouseEnter={() => setHoveredDish(dish.id)}
                                onMouseLeave={() => setHoveredDish(null)}
                            >
                                <div className="relative h-56 overflow-hidden">
                                    <img
                                        src={dish.image}
                                        alt={dish.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 right-4 bg-amber-500 text-white px-2 py-1 rounded-lg text-sm font-bold">
                                        ★ {dish.rating}
                                    </div>
                                    {hoveredDish === dish.id && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-all">
                                            <button className="bg-white text-amber-600 px-6 py-2 rounded-full font-semibold hover:bg-amber-600 hover:text-white transition-colors">
                                                Xem Chi Tiết
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-gray-800">{dish.name}</h3>
                                        <span className="text-amber-600 font-bold text-lg">{dish.price.toLocaleString()}đ</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                        <span className="flex items-center gap-1">📦 {dish.orders} đã bán</span>
                                        <span className="flex items-center gap-1">⭐ {dish.rating}</span>
                                    </div>
                                    <button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
                                        Đặt Món
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <button
                            onClick={() => navigate('/menu')}
                            className="inline-flex items-center gap-2 text-amber-600 font-semibold hover:text-amber-700 transition-colors"
                        >
                            Xem Tất Cả Món Ăn <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <span className="text-amber-600 font-semibold uppercase tracking-wide">Tại Sao Chọn Chúng Tôi</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mt-2">Trải Nghiệm Đẳng Cấp</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all transform hover:-translateY-2">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 mb-6">
                                <Utensils className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Nguyên Liệu Tươi Ngon</h3>
                            <p className="text-gray-600">Chúng tôi chỉ sử dụng nguyên liệu tươi ngon nhất, đảm bảo an toàn vệ sinh thực phẩm</p>
                        </div>
                        <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all transform hover:-translateY-2">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 mb-6">
                                <ChefHat className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Đầu Bếp Chuyên Nghiệp</h3>
                            <p className="text-gray-600">Đội ngũ đầu bếp giàu kinh nghiệm, đam mê ẩm thực và sáng tạo</p>
                        </div>
                        <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all transform hover:-translateY-2">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 mb-6">
                                <Truck className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Giao Hàng Nhanh Chóng</h3>
                            <p className="text-gray-600">Giao hàng tận nơi trong vòng 30 phút, đảm bảo món ăn còn nóng hổi</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Special Offers */}
            <div className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <span className="text-amber-600 font-semibold uppercase tracking-wide">Ưu Đãi Hấp Dẫn</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mt-2">Khuyến Mãi Đặc Biệt</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto mt-4">Nhận ngay ưu đãi khi đặt món hôm nay</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {offers.map(offer => (
                            <div key={offer.id} className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translateY-2">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-white/20 rounded-full p-3">
                                        {offer.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">{offer.title}</h3>
                                        <p className="text-amber-100">{offer.description}</p>
                                    </div>
                                </div>
                                <div className="bg-white/20 rounded-lg p-3 mt-4">
                                    <span className="text-sm">Mã: </span>
                                    <span className="font-mono font-bold tracking-wider">{offer.code}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Testimonials Section */}
            <div className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <span className="text-amber-600 font-semibold uppercase tracking-wide">Khách Hàng Nói Gì</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mt-2">Phản Hồi Từ Thực Khách</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div key={testimonial.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <img src={testimonial.avatar} alt={testimonial.name} className="w-14 h-14 rounded-full object-cover" />
                                    <div>
                                        <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-600 mb-3">"{testimonial.comment}"</p>
                                <div className="text-amber-600 text-sm font-semibold">🍽️ {testimonial.dish}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Info & Hours Section */}
            <div className="py-20">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Opening Hours */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg">
                            <div className="flex items-center gap-3 mb-6">
                                <Clock className="w-8 h-8 text-amber-600" />
                                <h3 className="text-2xl font-bold text-gray-800">Giờ Mở Cửa</h3>
                            </div>
                            <div className="space-y-4">
                                {openingHours.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center pb-3 border-b border-gray-100">
                                        <span className="text-gray-600">{item.day}</span>
                                        <span className="font-semibold text-gray-800">{item.hours}</span>
                                    </div>
                                ))}
                                <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-amber-600">
                                        <Sparkles size={18} />
                                        <span className="font-semibold">Đặt bàn trước 24h để nhận ưu đãi đặc biệt</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact & Location */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg">
                            <div className="flex items-center gap-3 mb-6">
                                <MapPin className="w-8 h-8 text-amber-600" />
                                <h3 className="text-2xl font-bold text-gray-800">Thông Tin Liên Hệ</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-amber-600 mt-1" />
                                    <span className="text-gray-600">123 Đường Nguyễn Huệ, Quận 1, TP.HCM</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-amber-600" />
                                    <span className="text-gray-600">Hotline: 1900 1234</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CreditCard className="w-5 h-5 text-amber-600" />
                                    <span className="text-gray-600">Chấp nhận thanh toán: Visa, Mastercard, Momo</span>
                                </div>
                                <div className="flex gap-4 mt-6">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                                        <Wifi size={16} className="text-amber-600" />
                                        <span className="text-sm">WiFi miễn phí</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                                        <Music size={16} className="text-amber-600" />
                                        <span className="text-sm">Nhạc nhẹ</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Newsletter Section */}
            <div className="py-16 bg-gradient-to-r from-amber-500 to-orange-600">
                <div className="container mx-auto px-4 text-center">
                    <h3 className="text-3xl font-bold text-white mb-4">Nhận Ngay Ưu Đãi</h3>
                    <p className="text-amber-100 mb-6">Đăng ký nhận bản tin để nhận mã giảm giá và thông tin khuyến mãi mới nhất</p>
                    <div className="max-w-md mx-auto flex gap-4">
                        <input
                            type="email"
                            placeholder="Email của bạn"
                            className="flex-1 px-4 py-3 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-white"
                        />
                        <button className="bg-white text-amber-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                            Đăng Ký
                        </button>
                    </div>
                </div>
            </div>

            <Footer />

            <style>{`
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes scroll {
                    0% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                }
                
                .animate-fade-in-up {
                    animation: fade-in-up 1s ease-out;
                }
                
                .animate-scroll {
                    animation: scroll 1.5s ease-in-out infinite;
                }
                
                .hover\\:-translateY-2:hover {
                    transform: translateY(-8px);
                }
            `}</style>
        </div>
    );
}

export default HomePage;