import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '../styles/ReviewsCarousel.css';

const ReviewsCarousel = () => {
    const reviews = [
        {
            id: 1,
            title: "Amazing tools!",
            text: "It's super easy to navigate, and the customer support is fantastic",
            rating: 5
        },
        {
            id: 2,
            title: "UI is sooo clean",
            text: "Amazing UI and very simple to use. Also amazing tutorials and support from the team",
            rating: 5
        },
        {
            id: 3,
            title: "Team is Fantastic",
            text: "The perfect solution for my needs. The team walked me through everything",
            rating: 4
        }
    ];

    const settings = {
        dots: false,
        infinite: true,
        speed: 5050,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 0,
        cssEase: "linear",
        arrows: false,
        variableWidth: true,
        centerMode: false,
        pauseOnHover: false
    };

    // Duplicate reviews array multiple times for continuous scrolling
    const extendedReviews = [...reviews, ...reviews, ...reviews, ...reviews];

    return (
        <div className="reviews-section">
            <h2>Reviews</h2>
            <Slider {...settings}>
                {extendedReviews.map((review, index) => (
                    <div key={`${review.id}-${index}`} className="review-slide">
                        <div className="review-card">
                            <h3>{review.title}</h3>
                            <p>{review.text}</p>
                            <div className="stars">
                                {[...Array(5)].map((_, index) => (
                                    <span key={index} className={index < review.rating ? 'star filled' : 'star'}>
                                        ★
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </Slider>
        </div>
    );
};

export default ReviewsCarousel; 