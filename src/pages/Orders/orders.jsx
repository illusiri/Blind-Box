import React from 'react';
import ListCard from '../../components/Card/listCard.jsx';  
import './orders.css';
export default function Orders() {
    const orders = [
        {
            id: 1,
            image: 'https://example.com/order1.jpg',
            title: 'Order 1',
            description: 'This is the first order.',
            price: '$50',
            status: 'Shipped'
        },
        {
            id: 2,
            image: 'https://example.com/order2.jpg',
            title: 'Order 2',
            description: 'This is the second order.',
            price: '$75',
            status: 'Pending'
        },
        {
            id: 3,
            image: 'https://example.com/order3.jpg',
            title: 'Order 3',
            description: 'This is the third order.',
            price: '$100',
            status: 'Delivered'
        },
        {
            id: 4,
            image: 'https://example.com/order4.jpg',
            title: 'Order 4',
            description: 'This is the fourth order.',
            price: '$25',
            status: 'Cancelled'
        }
    ];

    const [searchTerm, setSearchTerm] = React.useState('');
    const filteredOrders = orders.filter(order =>
        order.title.toLowerCase().includes(searchTerm.toLowerCase())||
        order.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (
        <div className="orders">
            <h1>My Orders</h1>
            <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className = 'search-input'
            />
            <div className="order-list">
                {filteredOrders.map(order => (
                    <ListCard key={order.id} Item={order} />
                ))}
            </div>
        </div>
    );
}



