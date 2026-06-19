import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productionId = searchParams.get('production_id');
  
  if (!productionId) {
    return NextResponse.json({ error: '缺少生产ID' }, { status: 400 });
  }
  
  try {
    // 获取域名
    const domain = process.env.COZE_PROJECT_DOMAIN_DEFAULT || `http://localhost:${process.env.DEPLOY_RUN_PORT}`;
    
    // 生成二维码链接
    const url = `${domain}/worker/complete?id=${productionId}`;
    
    // 生成二维码图片（Base64）
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    
    return NextResponse.json({ 
      success: true,
      qrCode: qrCodeDataUrl,
      url,
    });
  } catch (error) {
    console.error('生成二维码失败:', error);
    return NextResponse.json({ error: '生成二维码失败' }, { status: 500 });
  }
}