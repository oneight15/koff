import 'normalize.css';
import './style.scss';
import Navigo from 'navigo';
import { Header } from './modules/Header/Header';
import { Main } from './modules/Main/Main';
import { Order } from './modules/Order/Order';
import { Footer } from './modules/Footer/Footer';
import { ProductList } from './modules/ProductList/ProductList';
import { ApiService } from './services/ApiService';
import { Catalog } from './modules/Catalog/Catalog';
import { FavoriteService } from './services/StorageService';
import { Pagination } from './features/Pagination/Pagination';



const productSlider = () => {
  Promise.all([
    import('swiper/modules'),
    import('swiper'),
    import('swiper/css'),
  ]).then(([{ Navigation, Thumbs }, Swiper]) => {
    const swiperThumbnails = new Swiper.default(".product__slider-thumbnails", {
      spaceBetween: 10,
      slidesPerView: 4,
      freeMode: true,
      watchSlidesProgress: true,
    });

    new Swiper.default(".product__slider-main", {
      spaceBetween: 10,
      navigation: {
        nextEl: ".product__arrow_next",
        prevEl: ".product__arrow_prev",
      },
      modules: [Navigation, Thumbs],
      thumbs: {
        swiper: swiperThumbnails,
      },
    });
  });
};

const init = () => {
  const api = new ApiService();
  const router = new Navigo('/', {linksSelector: 'a[href^="/"]'});

  new Header().mount();
  new Main().mount();
  new Footer().mount();

  api.getProductCategories().then(data => {
    new Catalog().mount(new Main().element, data);
    router.updatePageLinks();
  });

  productSlider();

  router
    .on(
      '/',
      async () => {
        const products = await api.getProducts();
        new ProductList().mount(new Main().element, products);
        router.updatePageLinks();
      },
      {
        leave(done) {
          new ProductList().unmount();
          done();
        },
        already(match) {
          match.route.handler(match);
        },
      },
    )
    .on('/category',
      async ({params: {slug, page}}) => {
        const {data: products, pagination} = await api.getProducts({
          category: slug,
          page: page || 1,
        });
        new ProductList().mount(new Main().element, products, slug);
        new Pagination()
          .mount(new ProductList().containerElement)
          .update(pagination);
        router.updatePageLinks();
      },
      {
        leave(done) {
          new ProductList().unmount();
          done();
        },
      },
    )
    .on('/favorite',
      async () => {
        const favorite = new FavoriteService().get();
        const {data: product} = await api.getProducts({list: favorite.join(',')});
        new ProductList().mount(new Main().element, product, 'Избранное',
          'Вы пока ничего не добавили в избранное...');
        router.updatePageLinks();
      },
      {
        leave(done) {
          new ProductList().unmount();
          done();
        },
        already(match) {
          match.route.handler(match);
        },
      },
    )
    .on('/search', () => {
      console.log('search');
    })
    .on('/product/:id', (obj) => {
      console.log('obj', obj);
    })
    .on('/cart', () => {
      console.log('cart');
    })
    .on('/order',
      () => {
        console.log('order');
        new Order().mount(new Main().element);
      },
      {
        leave(done) {
          new Order().unmount();
          done();
        },
      },
    )
    .notFound(() => {
      new Main().element.innerHTML = `
        <h2>Страница не найдена</h2>
        <p>Через 5 секунд Вы будете перенаправлены
          <a href="/">на главную страницу</a>
        </p>`;
      
      setTimeout(() => {
        router.navigate('/');
      }, 5000);
    },
    {
      leave(done) {
        new Main().element.textContent = '';
        done();
      },
    },
    );

  router.resolve();
};

init();

