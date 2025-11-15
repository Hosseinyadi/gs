-auto mb-2 text-green-600" />
                            <p className="text-sm font-medium">دیتابیس</p>
                            <Badge className="bg-green-500 mt-1">فعال</Badge>
                          </div>
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <Activity className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                            <p className="text-sm font-medium">سرور</p>
                            <Badge className="bg-blue-500 mt-1">آنلاین</Badge>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <Shield className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                            <p className="text-sm font-medium">امنیت</p>
                            <Badge className="bg-purple-500 mt-1">ایمن</Badge>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <Package className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                            <p className="text-sm font-medium">نسخه</p>
                            <Badge className="bg-orange-500 mt-1">2.0</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* Existing component tabs */}
            {activeTab === 'listings' && <AdminListings />}
            {activeTab === 'users' && <AdminUsers />}
            {activeTab === 'providers' && <AdminProviders />}
            {activeTab === 'discounts' && <AdminDiscounts />}
            {activeTab === 'reports' && <AdminReports />}
            {activeTab === 'settings' && <AdminSettings />}
            {activeTab === 'audit' && <AdminAuditLogs />}

            {/* Placeholder for other tabs */}
            {['media', 'pages', 'notifications', 'categories', 'messages', 'payments', 'marketing', 
              'security', 'backup', 'help', 'support', 'analytics'].includes(activeTab) && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-4">
                  {(() => {
                    const tab = allTabs.find(t => t.id === activeTab);
                    if (tab) {
                      const Icon = tab.icon;
                      return <Icon className="w-10 h-10 text-gray-500" />;
                    }
                    return null;
                  })()}
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  بخش {allTabs.find(t => t.id === activeTab)?.label}
                </h3>
                <p className="text-gray-600 mb-4">این بخش در حال توسعه و تکمیل است</p>
                <div className="inline-flex flex-col gap-2 text-right">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">در نسخه بعدی فعال خواهد شد</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">تیم توسعه در حال کار روی این بخش</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
