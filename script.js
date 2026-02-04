const API_URL = 'https://api.escuelajs.co/api/v1/products';
let allProducts = [];
let currentData = [];
let currentPage = 1;
let rowsPerPage = 10;


// --- BIẾN MỚI CHO BƯỚC 5: Lưu trạng thái sắp xếp ---
// 'asc': tăng dần, 'desc': giảm dần, '': chưa sắp xếp
let sortState = { column: '', direction: 'asc' }; 

// Biến giữ Modal instance của Bootstrap
let myModal;

let isEditMode = false;

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    setupControls();
    // Khởi tạo Modal Bootstrap
    myModal = new bootstrap.Modal(document.getElementById('productModal'));
});

async function fetchProducts() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        allProducts = data;
        currentData = data;
        renderApp();
    } catch (error) {
        console.error("Lỗi gọi API:", error);
    }
}

function renderApp() {
    renderTable();
    renderPagination();
    updateSortIcons(); // Cập nhật icon mũi tên
}

// --- LOGIC SẮP XẾP (MỚI) ---
window.handleSort = function(column) {
    // Đảo ngược hướng nếu đang click vào cùng 1 cột, ngược lại thì reset về 'asc'
    if (sortState.column === column) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.column = column;
        sortState.direction = 'asc';
    }

    // Thực hiện sắp xếp dữ liệu hiện tại (currentData)
    currentData.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // Nếu là chữ (Title) thì dùng localeCompare để so sánh chuẩn
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
        return 0;
    });

    renderApp(); // Vẽ lại giao diện
}

// Hàm cập nhật icon mũi tên bên cạnh tiêu đề
function updateSortIcons() {
    // Reset icon về mặc định
    document.getElementById('icon-title').innerText = '↕';
    document.getElementById('icon-price').innerText = '↕';

    // Set icon cho cột đang active
    if (sortState.column) {
        const icon = sortState.direction === 'asc' ? '↑' : '↓';
        document.getElementById(`icon-${sortState.column}`).innerText = icon;
    }
}

function renderTable() {
    const tableBody = document.getElementById('table-body');
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const productsToShow = currentData.slice(startIndex, endIndex);

    let htmlContent = '';
    
    if (productsToShow.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Không có dữ liệu</td></tr>';
        return;
    }

    productsToShow.forEach(product => {
        let imageUrl = product.images.length > 0 ? product.images[0] : '';
        if (imageUrl.startsWith('["')) { try { imageUrl = JSON.parse(imageUrl)[0]; } catch (e) {} }

        // THAY ĐỔI: Thêm onclick="openModal(${product.id})" vào thẻ tr
        htmlContent += `
            <tr onclick="openModal(${product.id})" title="Click để xem chi tiết" style="cursor: pointer;">
                <td class="text-center fw-bold">${product.id}</td>
                <td class="text-center">
                    <img src="${imageUrl}" class="product-img" 
                         onerror="this.onerror=null; this.src='https://placehold.co/80x80?text=No+Image';">
                </td>
                <td>${product.title}</td>
                <td class="text-success fw-bold">$${product.price}</td>
                <td><span class="badge bg-info text-dark">${product.category.name}</span></td>
            </tr>
        `;
    });
    tableBody.innerHTML = htmlContent;
}

// --- LOGIC MODAL & CRUD (GỘP CHUNG) ---

// 1. Mở Modal ở chế độ TẠO MỚI
function openCreateModal() {
    isEditMode = false;
    document.getElementById('product-form').reset(); // Xóa trắng form
    
    // Set giao diện
    document.querySelector('.modal-title').innerText = "Tạo sản phẩm mới";
    document.getElementById('modal-id').value = ""; // ID trống
    document.getElementById('modal-img-preview').src = "https://placehold.co/300x200?text=New+Product"; // Ảnh mặc định
    
    myModal.show();
}

// 2. Mở Modal ở chế độ SỬA (View/Edit)
function openModal(id) {
    isEditMode = true;
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    // Set giao diện
    document.querySelector('.modal-title').innerText = `Chỉnh sửa sản phẩm #${id}`;
    
    // Đổ dữ liệu
    document.getElementById('modal-id').value = product.id;
    document.getElementById('modal-title').value = product.title;
    document.getElementById('modal-price').value = product.price;
    document.getElementById('modal-desc').value = product.description;

    let imgUrl = product.images.length > 0 ? product.images[0] : '';
    if (imgUrl.startsWith('["')) { try { imgUrl = JSON.parse(imgUrl)[0]; } catch (e) {} }
    document.getElementById('modal-img-preview').src = imgUrl || 'https://placehold.co/300x200?text=No+Image';

    myModal.show();
}

// 3. Hàm LƯU chung (Xử lý cả Create và Update)
// Bạn sửa lại nút trong HTML: onclick="handleSave()" thay vì updateProduct()
async function handleSave() {
    // Sửa lại tên hàm trong HTML nút "Lưu thay đổi" thành handleSave() nhé!
    // Nếu chưa sửa HTML modal thì làm ngay bước này ở file index.html hoặc dùng JS gán lại.
    
    const title = document.getElementById('modal-title').value;
    const price = parseFloat(document.getElementById('modal-price').value);
    const description = document.getElementById('modal-desc').value;

    // Validate cơ bản
    if (!title || !price) {
        alert("Vui lòng nhập Tên và Giá!");
        return;
    }

    // Chuẩn bị dữ liệu gửi đi
    const payload = {
        title: title,
        price: price,
        description: description,
        categoryId: 1, // Mặc định category ID = 1 (Clothes) để API không lỗi
        images: ["https://placehold.co/600x400"] // Ảnh mặc định
    };

    try {
        let url = API_URL;
        let method = 'POST';

        if (isEditMode) {
            // Nếu là sửa: Dùng PUT và thêm ID vào URL
            const id = document.getElementById('modal-id').value;
            url = `${API_URL}/${id}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            alert(isEditMode ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
            
            if (isEditMode) {
                // Update mảng local
                const idx = allProducts.findIndex(p => p.id == result.id);
                if (idx !== -1) allProducts[idx] = { ...allProducts[idx], ...result };
            } else {
                // Thêm mới vào đầu danh sách
                allProducts.unshift(result);
            }

            myModal.hide();
            // Reset về trang 1 để thấy sản phẩm mới nhất
            currentPage = 1; 
            // Nếu đang search thì reset search luôn để thấy item mới
            document.getElementById('search-input').value = ''; 
            currentData = allProducts;
            
            renderApp();
        } else {
            alert('Thao tác thất bại! (Lỗi từ phía Server Fake API)');
        }
    } catch (error) {
        console.error(error);
        alert('Lỗi kết nối!');
    }
}

function renderPagination() {
    const paginationEl = document.getElementById('pagination');
    paginationEl.innerHTML = '';
    const totalPages = Math.ceil(currentData.length / rowsPerPage);
    if (totalPages <= 1) return;

    const createBtn = (page, text, isActive = false, isDisabled = false) => {
        return `<li class="page-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}">
                    <button class="page-link" onclick="changePage(${page})">${text}</button>
                </li>`;
    };

    // Prev
    paginationEl.innerHTML += createBtn(currentPage - 1, 'Previous', false, currentPage === 1);

    // Pages
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    if (endPage - startPage < 4) {
        if (startPage === 1) endPage = Math.min(totalPages, startPage + 4);
        else if (endPage === totalPages) startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationEl.innerHTML += createBtn(i, i, i === currentPage);
    }

    // Next
    paginationEl.innerHTML += createBtn(currentPage + 1, 'Next', false, currentPage === totalPages);
}

window.changePage = function(page) {
    currentPage = page;
    renderApp();
}

function setupControls() {
    document.getElementById('search-input').addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        currentData = allProducts.filter(p => p.title.toLowerCase().includes(keyword));
        
        // Reset sort khi search để tránh nhầm lẫn (tuỳ chọn)
        sortState = { column: '', direction: 'asc' };
        
        currentPage = 1;
        renderApp();
    });

    document.getElementById('rows-per-page').addEventListener('change', (e) => {
        rowsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderApp();
    });
}

function exportToCSV() {
    // 1. Kiểm tra nếu không có dữ liệu
    if (currentData.length === 0) {
        alert("Không có dữ liệu để xuất!");
        return;
    }

    // 2. Tạo tiêu đề cột (Header)
    // \ufeff là BOM character để Excel hiển thị đúng tiếng Việt/Unicode
    let csvContent = "\ufeffID,Title,Price,Category,Description\n";

    // 3. Duyệt qua dữ liệu ĐANG CÓ (currentData)
    currentData.forEach(product => {
        // Xử lý dữ liệu: Xóa dấu phẩy và xuống dòng để tránh lỗi file CSV
        const safeTitle = product.title.replace(/,/g, " ").replace(/\n/g, " ");
        const safeDesc = product.description.replace(/,/g, " ").replace(/\n/g, " ");
        const safeCategory = product.category.name.replace(/,/g, " ");

        // Nối dòng vào chuỗi CSV
        csvContent += `${product.id},${safeTitle},${product.price},${safeCategory},${safeDesc}\n`;
    });

    // 4. Tạo file ảo và kích hoạt tải xuống
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "danh_sach_san_pham.csv");
    document.body.appendChild(link);
    link.click(); // Giả lập click
    document.body.removeChild(link); // Xóa link sau khi tải xong
}