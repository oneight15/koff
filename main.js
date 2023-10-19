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
import { BreadCrumbs } from './features/BreadCrumbs/BreadCrumbs';
import { ProductCard } from './modules/ProductCard/ProductCard';
import { productSlider } from './features/productSlider/productSlider';

export const router = new Navigo('/', {linksSelector: 'a[href^="/"]'});

const init = () => {
  const api = new ApiService();

  new Header().mount();
  new Main().mount();
  new Footer().mount();

  router
    .on(
      '/',
      async () => {
        new Catalog().mount(new Main().element);
        const products = await api.getProducts();
        new ProductList().mount(new Main().element, products);
        router.updatePageLinks();
      },
      {
        leave(done) {
          new ProductList().unmount();
          new Catalog().unmount();
          done();
        },
        already(match) {
          match.route.handler(match);
        },
      },
    )
    .on('/category',
      async ({params: {slug, page = 1}}) => {
        new Catalog().mount(new Main().element);
        const {data: products, pagination} = await api.getProducts({
          category: slug,
          page: page,
        });

        new BreadCrumbs().mount(new Main().element, [{text: slug}]);
        new ProductList().mount(new Main().element, products, slug);
        new Pagination()
          .mount(new ProductList().containerElement)
          .update(pagination);
        router.updatePageLinks();
      },
      {
        leave(done) {
          new BreadCrumbs().unmount();
          new ProductList().unmount();
          new Catalog().unmount();
          done();
        },
      },
    )
    .on('/favorite',
      async ({params}) => {
        new Catalog().mount(new Main().element);
        const favorite = new FavoriteService().get();
        const {data: product, pagination} = await api.getProducts({
          list: favorite.join(','),
          page: params?.page || 1,
        });
        new BreadCrumbs().mount(new Main().element, [{text: 'Избранное'}]);
        new ProductList().mount(new Main().element, product, 'Избранное',
          'Вы пока ничего не добавили в избранное...');
        new Pagination()
          .mount(new ProductList().containerElement)
          .update(pagination);
        router.updatePageLinks();
      },
      {
        leave(done) {
          new BreadCrumbs().unmount();
          new ProductList().unmount();
          new Catalog().unmount();
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
    .on('/product/:id', async (obj) => {
      new Catalog().mount(new Main().element);
      const data = await api.getProductById(obj.data.id);
      new BreadCrumbs().mount(new Main().element, [
        {
          text: data.category,
          href: `/category?slug=${data.category}`
        },
        {
          text: data.name
        }
      ]);
      new ProductCard().mount(new Main().element, data);
      productSlider();
    },
    {
      leave(done) {
        new Catalog().unmount();
        new BreadCrumbs().unmount();
        new ProductCard().unmount();
        done();
      }
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

