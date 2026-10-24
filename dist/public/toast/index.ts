export const messages = [
  {
    url: '/sessions/table-view',
    message: 'مشکلی پیش آمده است',
  },
  {
    url: 'export/get-list-of-exports-file',
    message: 'مشکلی پیش آمده است',
  },
  {
    url: `export/delete-export-file/${'fileName'}`,
    message: 'مشکلی پیش آمده است',
  },
  {
    url: `export/delete-export-file/${'fileName'}`,
    message: 'مشکلی پیش آمده است',
  },
  {
    url: 'graph/get-graph',
    message: 'مشکلی پیش آمده است',
  },
  {
    // تست ندارد
    url: '/sessions/create-session',
    message: '',
  },
  {
    // تست ندارد
    url: '/filter/get-active-filters-bar',
    message: '',
  },
  {
    // ندارد
    url: '/filter/get-active-filters-bar',
    message: '',
  },

  {
    url: '',
    message: 'حجم فایل ارسالی بیش از حد مجاز است',
    condition: 'add node file upload > 100_000_000',
  },
  {
    url: '',
    message: 'فایل ارسالی فاقد رکورد می باشد',
    condition: 'add node file upload row length < 2',
  },
  {
    url: '',
    message: 'فایل  حاوی ستون هایی با نام تکراری است',
    condition: 'add node file duplicate cplumns',
  },
  {
    url: 'graph/add-node-to-graph',
    message: 'گره با موفقیت به گراف افزوده شد', // info
  },
  {
    url: 'graph/add-node-to-graph',
    message: 'گره با موفقیت به گراف افزوده شد', // success if message
  },

  {
    url: 'filter/save-filter', // error
    message: 'مشکلی پیش آمده است. مجددا سعی کنید', // backend message has proi
  },
  {
    url: '', // error
    message: 'ابتدا یال را انتخاب کنید',
    condition: 'update link, not selected any links',
  },
  {
    url: '', // error
    message: 'یال انتخابی به روز می باشد',
    condition: 'update link',
  },
  {
    url: '', // error
    message: 'یال انتخابی به روز می باشد',
    condition: 'update link',
  },
  {
    url: '', // error
    message: 'ارتباط مستقیمی بین یال و mainset و جود ندارد',
    condition: 'update link and mainset is not direct connection',
  },
  {
    url: '', // error
    message: 'ابتدا گره را انتخاب کنید',
    condition: 'update node and not selected any nodes',
  },
  {
    url: '', // error
    message: 'گره انتخابی به روز می باشد',
    condition: 'update node and node is updated',
  },
  {
    url: '', // error
    message: 'ارتباطی برای این گره وجود ندارد',
    condition: 'update node and no connection',
  },
  {
    url: '', // error
    message: 'ارتباط مستقیمی بین گره و mainset و جود ندارد',
    condition: 'update node and mainset is not a connection',
  },
  {
    url: '', // error
    message: 'ابتدا یال را انتخاب کنید',
    condition: 'mainset on link and edge is not selected',
  },
  {
    url: '', // error
    message: 'ابتدا گره را انتخاب کنید',
    condition: 'mainset on node and node is not selected',
  },
  {
    url: '', // error
    message: 'ابتدا گره / لینک را انتخاب کنید',
    condition: 'filter and node/link is not selected',
  },
  {
    url: '', // info
    message: 'در حال توسعه می‌باشد',
    condition: 'linkchart  on context menu',
  },
  {
    url: '', // error
    message: 'ابتدا گره را انتخاب کنید',
    condition: 'gis export and node/link is not selected',
  },
  {
    url: '', // error
    message: 'این گره/یال فاقد داده می‌باشد',
    condition: 'gis export and count is zero',
  },
  {
    url: '', // error
    message: 'تعداد داده‌ی این گره بیش از حد مجاز درخواست خروجی می‌باشد',
    condition: 'gis export and count > gisThreshold',
  },
  {
    url: 'export/get-gis-csv-file/${nodeId}', // success
    message: 'فایل در حال پردازش اولیه می باشد', // backend has proi
  },
  {
    url: 'export/get-gis-csv-file/${nodeId}', // error
    message: 'مشکلی پیش آمده است. مجدد سعی کنید', // backend has proi
  },
  {
    url: '', // error
    message: 'ابتدا گره را انتخاب کنید',
    condition: 'tableview and not selected',
  },
  {
    url: '', // error
    message: 'این گره/یال فاقد داده می‌باشد',
    condition: 'tableview and count is zero',
  },
  {
    url: '', // error
    message: 'گره انتخاب شده‌ای وجود ندارد',
    condition: 'save image and not selected',
  },
  {
    url: '', // error
    message: 'این گره / لینک فاقد داده می‌باشد',
    condition: 'save image and count is zero',
  },
  {
    url: '', // error
    message: 'این گره / لینک فاقد داده می‌باشد',
    condition: 'save image and count is zero',
  },
  {
    url: `/export/get-zip-image-file/${'params.nodeId'}`, // success
    // backend has proi
    message:
      'درخواست شما با موفقیت ثبت شد و لینک دانلود به زودی در صفحه مدیریت لینک ها قابل دسترسی می باشد',
  },
  {
    url: `/export/get-zip-image-file/${'params.nodeId'}`, // error
    message: 'مشکلی پیش آمده است. مجددا سعی کنید', // backend has proi
  },
  {
    url: `/export/get-zip-image-file/${'params.nodeId'}`, // error
    message: 'مشکلی پیش آمده است. مجددا سعی کنید', // backend has proi
  },
  {
    url: `/export/get-zip-image-file/${'params.nodeId'}`, // error
    message: 'گره انتخاب شده‌ای وجود ندارد', // backend has proi
  },
  {
    url: '', // error
    message: 'گره انتخاب شده‌ای وجود ندارد',
    condition: 'data reload when node is not selected',
  },
  {
    url: '', // error
    message: 'مشکلی پیش آمده است. مجددا سعی کنید',
    condition: 'data reload when node is not selected',
  },
]
