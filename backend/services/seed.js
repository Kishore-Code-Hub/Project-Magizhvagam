const bcrypt = require('bcryptjs');
const prisma = require('./prisma');

const seedData = async () => {
  try {
    console.log('Initiating connection to database...');
    await prisma.$connect();

    console.log('Clearing database tables...');
    // Delete parent tables - cascade deletion handles order_items, cart_items, wishlist_items, addresses, product_images
    await prisma.order.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.setting.deleteMany({});
    await prisma.coupon.deleteMany({});
    await prisma.aboutPage.deleteMany({});
    await prisma.footerConfig.deleteMany({});
    await prisma.siteSettings.deleteMany({});
    await prisma.homepageSections.deleteMany({});
    await prisma.navigationConfig.deleteMany({});
    await prisma.animationConfig.deleteMany({});

    console.log('Seeding Admin User...');
    const adminPasswordHash = await bcrypt.hash('MagizhvagamSecure2026!', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Magizhvagam Admin',
        email: 'admin@magizhvagam.com',
        password: adminPasswordHash,
        passwordHash: adminPasswordHash,
        role: 'admin',
        emailVerified: true,
        isActive: true,
        accountActive: true,
        addresses: {
          create: [{
            fullName: 'Admin Main Office',
            phone: '9876543210',
            street: '12 Luxury Palace St',
            city: 'Chennai',
            state: 'Tamil Nadu',
            zipCode: '600001',
            country: 'India',
            isDefault: true
          }]
        }
      }
    });
    console.log(`Admin user created: ${admin.email}`);

    console.log('Seeding Categories...');
    const categoriesData = [
      { name: 'Birthday Return Gifts', slug: 'birthday-return-gifts', image: '/assets/images/categories/birthday.jpg' },
      { name: 'Wedding Return Gifts', slug: 'wedding-return-gifts', image: '/assets/images/categories/wedding.jpg' },
      { name: 'Baby Shower Gifts', slug: 'baby-shower-gifts', image: '/assets/images/categories/babyshower.jpg' },
      { name: 'Corporate Gifts', slug: 'corporate-gifts', image: '/assets/images/categories/corporate.jpg' },
      { name: 'Festival Gifts', slug: 'festival-gifts', image: '/assets/images/categories/festival.jpg' },
      { name: 'Kids Return Gifts', slug: 'kids-return-gifts', image: '/assets/images/categories/kids.jpg' },
      { name: 'Customized Gifts', slug: 'customized-gifts', image: '/assets/images/categories/customized.jpg' },
      { name: 'Eco-Friendly Gifts', slug: 'eco-friendly-gifts', image: '/assets/images/categories/ecofriendly.jpg' }
    ];

    const catMap = {};
    for (const cat of categoriesData) {
      const createdCat = await prisma.category.create({
        data: cat
      });
      catMap[cat.name] = createdCat.id;
    }
    console.log('Categories created successfully.');

    console.log('Seeding Products...');
    const productsData = [
      {
        name: 'Premium Brass Kumkum Holder',
        description: 'An elegant, hand-carved traditional brass kumkum holder, perfect for weddings, baby showers, and housewarming functions. Features intricate peacock designs.',
        price: 250,
        discountPrice: 199,
        stock: 500,
        categoryId: catMap['Wedding Return Gifts'],
        images: [{ url: '/assets/images/products/kumkum_holder.jpg' }],
        material: 'Brass',
        dimensions: '3.5 x 2 inches',
        weight: '150g',
        color: 'Gold',
        tags: ['brass', 'kumkum', 'traditional', 'wedding', 'return-gift'],
        averageRating: 4.8,
        totalReviews: 24
      },
      {
        name: 'Eco-Friendly Jute Bag Set',
        description: 'Eco-friendly, reusable jute return gift bags with cotton handles and floral design overlays. Durable, stylish, and perfect for carrying fruits, coconuts, and sweets.',
        price: 80,
        discountPrice: 65,
        stock: 1200,
        categoryId: catMap['Eco-Friendly Gifts'],
        images: [{ url: '/assets/images/products/jute_bag.jpg' }],
        material: 'Natural Jute',
        dimensions: '12 x 10 inches',
        weight: '80g',
        color: 'Natural Cream & Pink',
        tags: ['jute', 'bag', 'eco-friendly', 'green', 'wedding', 'bulk'],
        averageRating: 4.5,
        totalReviews: 12
      },
      {
        name: 'Handcrafted Wooden Sindoor Box',
        description: 'Premium wooden box with red felt lining, hand-painted by local artisans. Adds a traditional rustic charm to any festival return gift pack.',
        price: 150,
        discountPrice: 120,
        stock: 350,
        categoryId: catMap['Festival Gifts'],
        images: [{ url: '/assets/images/products/wooden_box.jpg' }],
        material: 'Rosewood',
        dimensions: '3 x 3 inches',
        weight: '110g',
        color: 'Mahogany Red',
        tags: ['wooden', 'box', 'handcrafted', 'sindoor', 'festival'],
        averageRating: 4.7,
        totalReviews: 8
      },
      {
        name: 'Luxury Silver Plated Puja Plate',
        description: 'Beautiful 8-inch silver plated puja plate decorated with flower motifs. Ideal return gift for weddings, housewarmings, and religious functions.',
        price: 499,
        discountPrice: 399,
        stock: 200,
        categoryId: catMap['Wedding Return Gifts'],
        images: [{ url: '/assets/images/products/puja_plate.jpg' }],
        material: 'Silver Plated Steel',
        dimensions: '8 inches diameter',
        weight: '220g',
        color: 'Silver',
        tags: ['silver', 'puja', 'plate', 'luxury', 'wedding', 'religious'],
        averageRating: 4.9,
        totalReviews: 32
      },
      {
        name: 'Clay Ganesha Idol on Leaf',
        description: 'Eco-friendly terracotta Ganesha idol resting on a decorative betel leaf, painted with water-soluble colors. A serene return gift choice for baby showers and housewarmings.',
        price: 180,
        discountPrice: 149,
        stock: 800,
        categoryId: catMap['Baby Shower Gifts'],
        images: [{ url: '/assets/images/products/ganesha_leaf.jpg' }],
        material: 'Clay / Terracotta',
        dimensions: '4 x 4 inches',
        weight: '180g',
        color: 'Green & Ochre',
        tags: ['clay', 'ganesha', 'idol', 'baby-shower', 'housewarming'],
        averageRating: 4.6,
        totalReviews: 15
      },
      {
        name: 'Personalized Leather Keychain',
        description: 'Genuine leather keychain custom engraved with names or initials. Comes in premium gold-trimmed gift box packaging. Suitable for corporate and birthday events.',
        price: 300,
        discountPrice: 220,
        stock: 600,
        categoryId: catMap['Customized Gifts'],
        images: [{ url: '/assets/images/products/keychain.jpg' }],
        material: 'Full Grain Leather',
        dimensions: '4 x 1 inches',
        weight: '30g',
        color: 'Tan Brown',
        tags: ['leather', 'keychain', 'personalized', 'corporate', 'birthday'],
        averageRating: 4.4,
        totalReviews: 19
      },
      {
        name: 'Premium Cartoon Activity Mug',
        description: 'Colorful ceramic mugs featuring funny cartoon characters with built-in straw holders. The perfect return gift for children\'s birthday parties.',
        price: 120,
        discountPrice: 99,
        stock: 450,
        categoryId: catMap['Kids Return Gifts'],
        images: [{ url: '/assets/images/products/kids_mug.jpg' }],
        material: 'Ceramic',
        dimensions: '11oz capacity',
        weight: '300g',
        color: 'Multi-Color',
        tags: ['mug', 'kids', 'ceramic', 'birthday', 'cartoon'],
        averageRating: 4.3,
        totalReviews: 5
      },
      {
        name: 'Silver-Finish Executive Pen Set',
        description: 'Exquisite rollerball pen set with silver finish and matching textured case. Ideal for corporate delegates, office functions, and executive giveaways.',
        price: 750,
        discountPrice: 599,
        stock: 150,
        categoryId: catMap['Corporate Gifts'],
        images: [{ url: '/assets/images/products/pen_set.jpg' }],
        material: 'Alloy & Silver Overlay',
        dimensions: '6 x 2 inches case',
        weight: '200g',
        color: 'Metallic Silver',
        tags: ['pen', 'corporate', 'executive', 'office', 'gift-set'],
        averageRating: 4.8,
        totalReviews: 21
      }
    ];

    const seededProducts = [];
    for (const prod of productsData) {
      const { images, ...rest } = prod;
      const createdProd = await prisma.product.create({
        data: {
          ...rest,
          images: {
            create: images
          }
        }
      });
      seededProducts.push(createdProd);
    }
    console.log(`${seededProducts.length} Products created.`);

    // Map seeded product IDs
    const featuredIds = seededProducts.slice(0, 4).map(p => p.id);
    const bestSellersIds = seededProducts.slice(2, 6).map(p => p.id);
    const newArrivalsIds = seededProducts.slice(4, 8).map(p => p.id);

    console.log('Seeding Homepage Settings...');
    const rawPhone = process.env.WHATSAPP_PHONE || '919876543210';
    let seededPhone = rawPhone.trim();

    await prisma.setting.create({
      data: {
        key: 'homepage',
        value: {
          heroBanners: [],
          promotionalBanners: [],
          featuredProductIds: featuredIds,
          bestSellerProductIds: bestSellersIds,
          newArrivalProductIds: newArrivalsIds,
          trendingProductIds: featuredIds,
          recommendedProductIds: newArrivalsIds,
          categoryHighlights: Object.values(catMap).slice(0, 4),
          testimonials: [],
          whatsappContact: seededPhone,
          theme_tokens: {
            hdr: {
              bg: 'rgba(250, 249, 246, 0.85)',
              border: 'rgba(106, 13, 173, 0.1)',
              logo_text: 'linear-gradient(135deg, #8a2be2 0%, #ff1493 100%)',
              logo_size: '30px',
              nav_link_color: '#212529',
              nav_link_hover: '#8a2be2',
              nav_link_active: '#8a2be2',
              nav_link_weight: '600',
              icon_color: '#212529',
              icon_hover: '#8a2be2',
              sticky_bg: 'rgba(250, 249, 246, 0.95)',
              sticky_shadow: '0 4px 24px rgba(106, 13, 173, 0.08)',
              sticky_height: '80px',
              height: '130px',
              announcement_bg: '#8a2be2',
              announcement_text: '#ffffff'
            },
            nav: {
              dropdown_bg: '#ffffff',
              dropdown_border: 'rgba(106, 13, 173, 0.1)',
              dropdown_shadow: '0 10px 15px -3px rgba(106, 13, 173, 0.08)',
              dropdown_item_color: '#212529',
              dropdown_item_hover_bg: 'rgba(106, 13, 173, 0.05)',
              dropdown_item_hover_color: '#8a2be2',
              mega_bg: '#ffffff',
              mega_accent: '#ff1493',
              mega_heading: '#212529',
              mega_link: '#6c757d',
              mega_promo_bg: '#f8f9fa',
              mobile_bg: '#ffffff',
              mobile_item: '#212529'
            },
            hero: {
              bg_overlay: 'rgba(0, 0, 0, 0.35)',
              overlay_opacity: '0.35',
              headline_color: '#ffffff',
              subheadline_color: '#ffffff',
              cta_primary_bg: '#8a2be2',
              cta_primary_text: '#ffffff',
              cta_primary_hover_bg: '#ff1493',
              cta_secondary_border: '#ffffff',
              cta_secondary_text: '#ffffff',
              badge_bg: 'rgba(255, 215, 0, 0.15)',
              badge_text: '#D4AF37'
            },
            pc: {
              bg: '#ffffff',
              border: 'rgba(106, 13, 173, 0.1)',
              border_radius: '16px',
              shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              hover_shadow: '0 10px 15px -3px rgba(106, 13, 173, 0.08)',
              hover_translate_y: '5',
              image_bg: '#f8f9fa',
              image_radius: '12px',
              name_color: '#212529',
              name_weight: '600',
              category_color: '#6c757d',
              current_price_color: '#8a2be2',
              original_price_color: '#6c757d',
              discount_badge_bg: '#ff1493',
              discount_badge_text: '#ffffff',
              flash_badge_bg: '#dc3545',
              flash_badge_text: '#ffffff',
              rating_color: '#ffbb00',
              rating_empty_color: '#cccccc',
              btn_bg: '#8a2be2',
              btn_text: '#ffffff',
              btn_hover_bg: '#ff1493',
              wishlist_icon_color: '#212529',
              wishlist_icon_active: '#ff1493',
              stock_in_color: '#28a745',
              stock_out_color: '#dc3545',
              stock_low_color: '#ffc107'
            },
            pdp: {
              gallery_border: 'rgba(106, 13, 173, 0.1)',
              gallery_active_border: '#8a2be2',
              gallery_thumb_radius: '8px',
              title_color: '#212529',
              title_size: '28px',
              price_color: '#8a2be2',
              compare_price_color: '#6c757d',
              specs_heading_color: '#212529',
              specs_value_color: '#6c757d',
              tab_active_color: '#8a2be2',
              tab_active_border: '#8a2be2',
              tab_inactive_color: '#6c757d',
              review_star_color: '#ffbb00',
              customization_panel_bg: '#f8f9fa',
              customization_panel_border: 'rgba(106, 13, 173, 0.1)',
              '3d_viewer_bg': '#f8f9fa',
              '3d_viewer_controls_color': '#8a2be2'
            },
            btn: {
              primary_bg: '#8a2be2',
              primary_text: '#ffffff',
              primary_hover_bg: '#ff1493',
              primary_radius: '30px',
              primary_shadow: '0 4px 15px rgba(106, 13, 173, 0.4)',
              secondary_bg: 'transparent',
              secondary_text: '#212529',
              secondary_border: '#8a2be2',
              secondary_hover_bg: 'rgba(106, 13, 173, 0.05)',
              ghost_bg: 'transparent',
              ghost_border: 'transparent',
              ghost_text: '#8a2be2',
              danger_bg: '#dc3545',
              danger_text: '#ffffff',
              disabled_bg: '#e9ecef',
              disabled_text: '#6c757d',
              btn_font_weight: '600',
              btn_letter_spacing: '0.05em',
              btn_transition: 'all 0.3s ease'
            },
            cart: {
              page_bg: '#ffffff',
              item_card_bg: '#f8f9fa',
              item_card_border: 'rgba(106, 13, 173, 0.1)',
              item_name_color: '#212529',
              item_price_color: '#8a2be2',
              quantity_btn_bg: '#e9ecef',
              quantity_btn_border: 'transparent',
              quantity_input_bg: '#ffffff',
              coupon_input_bg: '#ffffff',
              coupon_input_border: 'rgba(106, 13, 173, 0.1)',
              coupon_btn_bg: '#8a2be2',
              coupon_success_color: '#28a745',
              coupon_error_color: '#dc3545',
              warning_banner_bg: '#fff3cd',
              warning_banner_text: '#856404',
              warning_banner_border: '#ffeeba',
              summary_card_bg: '#f8f9fa',
              summary_card_border: 'rgba(106, 13, 173, 0.1)',
              total_label_color: '#212529',
              total_value_color: '#8a2be2',
              whatsapp_btn_bg: '#25d366',
              whatsapp_btn_text: '#ffffff',
              whatsapp_btn_hover_bg: '#20ba5a',
              checkout_btn_bg: '#8a2be2',
              checkout_btn_text: '#ffffff'
            },
            co: {
              page_bg: '#ffffff',
              step_indicator_active: '#8a2be2',
              step_indicator_complete: '#28a745',
              step_indicator_pending: '#6c757d',
              step_line_color: '#e9ecef',
              address_card_bg: '#ffffff',
              address_card_border: 'rgba(106, 13, 173, 0.1)',
              address_selected_border: '#8a2be2',
              address_selected_shadow: '0 4px 15px rgba(106, 13, 173, 0.15)',
              form_label_color: '#212529',
              form_input_bg: '#ffffff',
              form_input_border: 'rgba(106, 13, 173, 0.1)',
              form_input_focus_border: '#8a2be2',
              form_input_error_border: '#dc3545',
              payment_option_bg: '#ffffff',
              payment_option_border: 'rgba(106, 13, 173, 0.1)',
              payment_active_bg: 'rgba(106, 13, 173, 0.05)',
              order_summary_bg: '#f8f9fa',
              place_order_btn_bg: '#8a2be2',
              place_order_btn_text: '#ffffff'
            },
            ft: {
              bg: '#1B0F26',
              border_top: 'rgba(255, 255, 255, 0.1)',
              logo_text: 'linear-gradient(135deg, #ffd700 0%, #e5c100 100%)',
              heading_color: '#ffffff',
              link_color: '#cccccc',
              link_hover_color: '#ffd700',
              divider_color: 'rgba(255, 255, 255, 0.1)',
              copyright_bg: '#110919',
              copyright_text: '#888888',
              newsletter_input_bg: 'rgba(255, 255, 255, 0.05)',
              newsletter_input_border: 'rgba(255, 255, 255, 0.1)',
              newsletter_btn_bg: '#ffd700',
              newsletter_btn_text: '#1B0F26',
              social_icon_color: '#cccccc',
              social_icon_hover_color: '#ffd700',
              social_icon_bg: 'rgba(255, 255, 255, 0.05)',
              social_icon_hover_bg: 'rgba(255, 255, 255, 0.15)'
            },
            frm: {
              input_bg: '#ffffff',
              input_border: 'rgba(106, 13, 173, 0.1)',
              input_border_radius: '8px',
              input_focus_border: '#8a2be2',
              input_focus_shadow: '0 0 0 3px rgba(106, 13, 173, 0.15)',
              input_placeholder_color: '#6c757d',
              input_text_color: '#212529',
              input_error_border: '#dc3545',
              input_error_text: '#dc3545',
              input_success_border: '#28a745',
              input_success_text: '#28a745',
              label_color: '#212529',
              label_weight: '500',
              helper_text_color: '#6c757d',
              strength_weak: '#dc3545',
              strength_fair: '#ffc107',
              strength_strong: '#17a2b8',
              strength_perfect: '#28a745'
            },
            mod: {
              backdrop_color: 'rgba(0, 0, 0, 0.5)',
              backdrop_blur: '16px',
              modal_bg: '#ffffff',
              modal_border: 'rgba(106, 13, 173, 0.1)',
              modal_radius: '16px',
              modal_shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
              modal_header_bg: 'transparent',
              modal_header_border: 'rgba(106, 13, 173, 0.05)',
              modal_title_color: '#212529',
              modal_close_color: '#6c757d',
              modal_close_hover_color: '#212529',
              drawer_bg: '#ffffff',
              drawer_shadow: '0 -10px 25px rgba(0, 0, 0, 0.1)',
              toast_success_bg: '#28a745',
              toast_error_bg: '#dc3545',
              toast_warning_bg: '#ffc107',
              toast_info_bg: '#17a2b8',
              toast_text_color: '#ffffff'
            },
            bdg: {
              new_bg: 'rgba(255, 79, 129, 0.15)',
              new_text: '#FF4F81',
              sale_bg: 'rgba(220, 53, 69, 0.15)',
              sale_text: '#dc3545',
              flash_bg: 'rgba(255, 215, 0, 0.15)',
              flash_text: '#D4AF37',
              trending_bg: 'rgba(138, 43, 226, 0.15)',
              trending_text: '#8a2be2',
              out_of_stock_bg: 'rgba(108, 117, 125, 0.15)',
              out_of_stock_text: '#6c757d',
              limited_bg: 'rgba(255, 193, 7, 0.15)',
              limited_text: '#856404',
              featured_bg: 'rgba(255, 215, 0, 0.15)',
              featured_text: '#D4AF37',
              radius: '20px',
              font_weight: '700',
              padding: '4px 10px'
            },
            cd: {
              container_bg: '#f8f9fa',
              container_border: 'rgba(106, 13, 173, 0.1)',
              container_radius: '12px',
              digit_bg: '#ffffff',
              digit_text: '#212529',
              digit_border: 'rgba(106, 13, 173, 0.05)',
              digit_radius: '8px',
              separator_color: '#212529',
              label_color: '#6c757d',
              expired_bg: '#f8d7da',
              expired_text: '#721c24',
              flash_sale_accent: '#dc3545'
            },
            acc: {
              page_bg: '#ffffff',
              tab_active_color: '#8a2be2',
              tab_active_border: '#8a2be2',
              tab_inactive_color: '#6c757d',
              order_card_bg: '#f8f9fa',
              order_card_border: 'rgba(106, 13, 173, 0.1)',
              status_pending: '#ffc107',
              status_confirmed: '#17a2b8',
              status_shipped: '#8a2be2',
              status_delivered: '#28a745',
              status_cancelled: '#dc3545',
              address_card_bg: '#ffffff',
              address_card_border: 'rgba(106, 13, 173, 0.1)',
              address_cap_warning_bg: '#f8d7da',
              address_cap_warning_text: '#721c24'
            },
            st: {
              empty_icon_color: '#6c757d',
              empty_heading_color: '#212529',
              empty_text_color: '#6c757d',
              empty_cta_bg: '#8a2be2',
              error_icon_color: '#dc3545',
              error_heading_color: '#212529',
              error_text_color: '#6c757d',
              success_icon_color: '#28a745',
              success_heading_color: '#212529',
              success_text_color: '#6c757d',
              loading_spinner_color: '#8a2be2',
              skeleton_base_color: '#e9ecef',
              skeleton_shimmer_color: '#f5f5f5'
            },
            adm: {
              sidebar_bg: '#1B0F26',
              sidebar_border: 'rgba(255, 255, 255, 0.1)',
              sidebar_link_color: '#cccccc',
              sidebar_link_hover_bg: 'rgba(255, 255, 255, 0.05)',
              sidebar_link_active_bg: '#8a2be2',
              sidebar_link_active_text: '#ffffff',
              topbar_bg: '#ffffff',
              topbar_border: 'rgba(106, 13, 173, 0.1)',
              topbar_title_color: '#212529',
              stat_card_bg: '#ffffff',
              stat_card_border: 'rgba(106, 13, 173, 0.1)',
              table_header_bg: '#f8f9fa',
              table_row_hover: 'rgba(106, 13, 173, 0.02)',
              table_border: 'rgba(106, 13, 173, 0.05)',
              action_btn_edit_color: '#17a2b8',
              action_btn_delete_color: '#dc3545',
              toggle_active_bg: '#28a745',
              toggle_inactive_bg: '#dc3545',
              settings_tab_active: '#8a2be2'
            }
          },
          layout_config: {
            containerMaxWidth: '1200px',
            sectionPaddingY: '60px',
            sectionPaddingX: '24px',
            gridGap: '30px',
            cardRadius: '16px',
            btnRadius: '30px',
            inputRadius: '8px',
            borderWidth: '1px',
            shadowStrength: '0.1',
            glassOpacity: '0.85',
            glassBlur: '16px',
            animationSpeed: '1.0'
          },
          animation_config: {
            speed_mode: 'elevated',
            card_hover_style: 'lift'
          }
        }
      }
    });

    console.log('Homepage settings seeded successfully.');

    console.log('Seeding Sample Coupon...');
    await prisma.coupon.create({
      data: {
        code: 'WELCOME10',
        discountType: 'Percentage',
        discountValue: 10,
        minOrderValue: 500,
        expiresAt: new Date('2030-12-31'),
        active: true
      }
    });
    console.log('Sample coupon WELCOME10 seeded.');

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Database seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
